from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.database import get_db
from backend.app.core.config import settings
from backend.app.models.entities import (
    Transaction, Book, BookCopy, User, Fine, Notification
)
from backend.app.schemas.schemas import (
    BorrowRequest, ReturnRequest, TransactionOut, QRIssueRequest, QRReturnRequest
)
from backend.app.routers.deps import get_current_user, require_role, get_optional_current_user
from backend.app.ai.user_profiler import user_profiler

router = APIRouter(prefix="/loans", tags=["Loans & Transactions"])


def _format_transaction(t: Transaction) -> TransactionOut:
    now = datetime.utcnow()
    is_overdue = False
    remaining_days = None

    if t.status in ["BORROWED", "OVERDUE"]:
        delta = (t.due_date - now).days
        remaining_days = delta
        if delta < 0:
            is_overdue = True
    elif t.return_date and t.return_date > t.due_date:
        is_overdue = True

    return TransactionOut(
        id=t.id,
        user_id=t.user_id,
        user_name=t.user.name if t.user else "Unknown User",
        user_email=t.user.email if t.user else "",
        book_id=t.book_id,
        book_title=t.book.title if t.book else "Unknown Book",
        book_cover=t.book.cover_image if t.book else None,
        borrow_date=t.borrow_date,
        due_date=t.due_date,
        return_date=t.return_date,
        status="OVERDUE" if is_overdue and t.status == "BORROWED" else t.status,
        fine_amount=t.fine_amount or 0.0,
        fine_paid=t.fine_paid or False,
        remaining_days=remaining_days,
        is_overdue=is_overdue
    )


@router.post("/borrow", response_model=TransactionOut)
def borrow_book(
    payload: BorrowRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    book = db.query(Book).filter(Book.id == payload.book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found.")

    if book.available_copies <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Book is currently unavailable.")

    # Check already borrowed by this user
    already_borrowed = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.book_id == book.id,
        Transaction.status.in_(["BORROWED", "OVERDUE"])
    ).first()
    if already_borrowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already borrowed this book. Please return it before borrowing another copy."
        )

    # Check maximum active borrow limit
    active_count = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.status.in_(["BORROWED", "OVERDUE"])
    ).count()
    if active_count >= settings.MAX_ACTIVE_BORROWS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You have reached the maximum borrow limit of {settings.MAX_ACTIVE_BORROWS} books."
        )

    # Allocate an available copy
    copy = db.query(BookCopy).filter(
        BookCopy.book_id == book.id,
        BookCopy.status == "AVAILABLE"
    ).first()

    now = datetime.utcnow()
    due_date = now + timedelta(days=settings.BORROW_DAYS_LIMIT)

    transaction = Transaction(
        user_id=current_user.id,
        book_id=book.id,
        copy_id=copy.id if copy else None,
        borrow_date=now,
        due_date=due_date,
        status="BORROWED",
        fine_amount=0.0,
        fine_paid=False
    )
    db.add(transaction)

    # Update inventory
    book.available_copies = max(0, book.available_copies - 1)
    if copy:
        copy.status = "BORROWED"

    db.commit()
    db.refresh(transaction)

    # Trigger AI user profile update
    user_profiler.compute_user_profile(current_user.id, db)

    return _format_transaction(transaction)


@router.post("/return", response_model=TransactionOut)
def return_book(
    payload: ReturnRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    transaction = db.query(Transaction).filter(Transaction.id == payload.transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")

    is_librarian = current_user.role and current_user.role.name in ["librarian", "admin"]
    if transaction.user_id != current_user.id and not is_librarian:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized action.")

    if transaction.status == "RETURNED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This book has already been returned.")

    now = datetime.utcnow()
    transaction.return_date = now
    transaction.status = "RETURNED"

    # Calculate fine if overdue
    fine_amount = 0.0
    if now > transaction.due_date:
        overdue_days = (now - transaction.due_date).days
        if overdue_days > 0:
            fine_amount = round(overdue_days * settings.DAILY_FINE_RATE, 2)
            transaction.fine_amount = fine_amount
            fine_entry = Fine(
                transaction_id=transaction.id,
                amount=fine_amount,
                status="UNPAID"
            )
            db.add(fine_entry)

    # Restore inventory
    book = db.query(Book).filter(Book.id == transaction.book_id).first()
    if book:
        book.available_copies = min(book.total_copies, book.available_copies + 1)

    if transaction.copy_id:
        copy = db.query(BookCopy).filter(BookCopy.id == transaction.copy_id).first()
        if copy:
            copy.status = "AVAILABLE"

    db.commit()
    db.refresh(transaction)

    # Trigger AI user profile update
    user_profiler.compute_user_profile(transaction.user_id, db)

    return _format_transaction(transaction)


@router.post("/issue-by-qr", response_model=TransactionOut)
def issue_book_by_qr(
    payload: QRIssueRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Issue a book identified by QR scan to a selected student."""
    is_librarian = current_user.role and current_user.role.name in ["librarian", "admin"]

    # Resolve target student
    target_user = None
    if payload.user_id:
        target_user = db.query(User).filter(User.id == payload.user_id).first()
    elif payload.user_email:
        target_user = db.query(User).filter(User.email.ilike(payload.user_email.strip())).first()
    elif payload.student_id_or_email:
        query_val = payload.student_id_or_email.strip()
        if query_val.isdigit():
            target_user = db.query(User).filter(User.id == int(query_val)).first()
        if not target_user:
            target_user = db.query(User).filter(
                (User.email.ilike(query_val)) |
                (User.name.ilike(f"%{query_val}%"))
            ).first()

    if not target_user:
        if not is_librarian:
            target_user = current_user
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please specify a valid student ID or email to issue this book."
            )

    # Find the book
    book = db.query(Book).filter(Book.id == payload.book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found.")

    if book.available_copies <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"All copies of '{book.title}' are currently borrowed."
        )

    # Check if target student already has an active borrow for this book
    already_borrowed = db.query(Transaction).filter(
        Transaction.user_id == target_user.id,
        Transaction.book_id == book.id,
        Transaction.status.in_(["BORROWED", "OVERDUE"])
    ).first()
    if already_borrowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student {target_user.name} ({target_user.email}) currently has an active loan for this book."
        )

    # Check maximum active borrow limit
    active_count = db.query(Transaction).filter(
        Transaction.user_id == target_user.id,
        Transaction.status.in_(["BORROWED", "OVERDUE"])
    ).count()
    if active_count >= settings.MAX_ACTIVE_BORROWS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student has reached the maximum borrowing limit of {settings.MAX_ACTIVE_BORROWS} books."
        )

    # Allocate an available copy
    copy = db.query(BookCopy).filter(
        BookCopy.book_id == book.id,
        BookCopy.status == "AVAILABLE"
    ).first()

    now = datetime.utcnow()
    due_date = now + timedelta(days=settings.BORROW_DAYS_LIMIT)

    transaction = Transaction(
        user_id=target_user.id,
        book_id=book.id,
        copy_id=copy.id if copy else None,
        borrow_date=now,
        due_date=due_date,
        status="BORROWED",
        fine_amount=0.0,
        fine_paid=False
    )
    db.add(transaction)

    # Update inventory counts
    book.available_copies = max(0, book.available_copies - 1)
    if copy:
        copy.status = "BORROWED"

    db.commit()
    db.refresh(transaction)

    # Trigger AI user profile update
    user_profiler.compute_user_profile(target_user.id, db)

    return _format_transaction(transaction)


@router.post("/return-by-qr", response_model=TransactionOut)
def return_book_by_qr(
    payload: QRReturnRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return a book by scanning its QR Code, Book ID, or active Transaction ID."""
    is_librarian = current_user.role and current_user.role.name in ["librarian", "admin"]
    transaction = None

    if payload.transaction_id:
        transaction = db.query(Transaction).filter(Transaction.id == payload.transaction_id).first()
    elif payload.book_id or payload.qr_code:
        book_id = payload.book_id
        if not book_id and payload.qr_code:
            # Match book by QR code string
            qr_book = db.query(Book).filter(Book.qr_code.ilike(payload.qr_code.strip())).first()
            if qr_book:
                book_id = qr_book.id

        if book_id:
            query = db.query(Transaction).filter(
                Transaction.book_id == book_id,
                Transaction.status.in_(["BORROWED", "OVERDUE"])
            )
            if not is_librarian:
                query = query.filter(Transaction.user_id == current_user.id)
            transaction = query.order_by(Transaction.borrow_date.asc()).first()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active borrowing loan found for this book."
        )

    if transaction.status == "RETURNED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This book is already marked as returned.")

    now = datetime.utcnow()
    transaction.return_date = now
    transaction.status = "RETURNED"

    # Calculate fine if overdue
    fine_amount = 0.0
    if now > transaction.due_date:
        overdue_days = (now - transaction.due_date).days
        if overdue_days > 0:
            fine_amount = round(overdue_days * settings.DAILY_FINE_RATE, 2)
            transaction.fine_amount = fine_amount
            fine_entry = Fine(
                transaction_id=transaction.id,
                amount=fine_amount,
                status="UNPAID"
            )
            db.add(fine_entry)

    # Restore inventory
    book = db.query(Book).filter(Book.id == transaction.book_id).first()
    if book:
        book.available_copies = min(book.total_copies, book.available_copies + 1)

    if transaction.copy_id:
        copy = db.query(BookCopy).filter(BookCopy.id == transaction.copy_id).first()
        if copy:
            copy.status = "AVAILABLE"

    db.commit()
    db.refresh(transaction)

    # Trigger AI user profile update
    user_profiler.compute_user_profile(transaction.user_id, db)

    return _format_transaction(transaction)


@router.get("/my-active", response_model=List[TransactionOut])
def get_my_active_loans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.status.in_(["BORROWED", "OVERDUE"])
        )
        .order_by(Transaction.due_date.asc())
        .all()
    )
    return [_format_transaction(t) for t in transactions]


@router.get("/my-history", response_model=List[TransactionOut])
def get_my_borrowing_history(
    status_filter: Optional[str] = Query("all", description="all, BORROWED, RETURNED, OVERDUE"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)

    if status_filter and status_filter.upper() != "ALL":
        if status_filter.upper() == "OVERDUE":
            now = datetime.utcnow()
            query = query.filter(Transaction.status == "BORROWED", Transaction.due_date < now)
        else:
            query = query.filter(Transaction.status == status_filter.upper())

    transactions = query.order_by(desc(Transaction.borrow_date)).all()
    return [_format_transaction(t) for t in transactions]


@router.get("/history", response_model=List[TransactionOut])
def get_borrowing_history_alias(
    status_filter: Optional[str] = Query("all", description="all, BORROWED, RETURNED, OVERDUE"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Alias for /loans/my-history for backward compatibility."""
    return get_my_borrowing_history(status_filter=status_filter, db=db, current_user=current_user)


@router.get("/my-overdue", response_model=List[TransactionOut])
def get_my_overdue_loans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all overdue loans or loans with unpaid fines for the current user."""
    now = datetime.utcnow()
    # 1. Active loans past due date or status OVERDUE
    active_overdue = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.status.in_(["BORROWED", "OVERDUE"]),
            (Transaction.due_date < now) | (Transaction.status == "OVERDUE") | (Transaction.fine_amount > 0)
        )
        .all()
    )
    # 2. Returned loans with unpaid fines
    returned_unpaid = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.status == "RETURNED",
            Transaction.fine_amount > 0,
            Transaction.fine_paid == False
        )
        .all()
    )
    all_overdue = list({t.id: t for t in (active_overdue + returned_unpaid)}.values())
    return [_format_transaction(t) for t in all_overdue]


@router.get("/all", response_model=List[TransactionOut])
def get_all_transactions(
    status_filter: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["librarian", "admin"]))
):
    query = db.query(Transaction).join(User).join(Book)

    if status_filter and status_filter.upper() != "ALL":
        if status_filter.upper() == "OVERDUE":
            now = datetime.utcnow()
            query = query.filter(Transaction.status == "BORROWED", Transaction.due_date < now)
        else:
            query = query.filter(Transaction.status == status_filter.upper())

    if search:
        query = query.filter(
            (User.name.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%")) |
            (Book.title.ilike(f"%{search}%"))
        )

    transactions = query.order_by(desc(Transaction.borrow_date)).offset(skip).limit(limit).all()
    return [_format_transaction(t) for t in transactions]


@router.get("/overdue", response_model=List[TransactionOut])
def get_overdue_loans(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["librarian", "admin"]))
):
    now = datetime.utcnow()
    overdue_txs = (
        db.query(Transaction)
        .filter(
            Transaction.status == "BORROWED",
            Transaction.due_date < now
        )
        .order_by(Transaction.due_date.asc())
        .all()
    )
    return [_format_transaction(t) for t in overdue_txs]


@router.post("/fines/{transaction_id}/pay")
def pay_or_waive_fine(
    transaction_id: int,
    action: str = Query("pay", description="pay or waive"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["librarian", "admin"]))
):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")

    tx.fine_paid = True
    fines = db.query(Fine).filter(Fine.transaction_id == tx.id).all()
    for f in fines:
        f.status = "PAID" if action == "pay" else "WAIVED"
        f.paid_at = datetime.utcnow()

    db.commit()
    return {"message": f"Fine successfully marked as {action}ed."}
