import io
import base64
import json
import re
import httpx
import qrcode
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc, or_
from backend.app.database import get_db
from backend.app.models.entities import (
    Book, Author, Category, BookCopy, Transaction, Rating, Feedback, BookView, User
)
from backend.app.schemas.schemas import (
    BookOut, BookDetailOut, BookCreate, BookUpdate, BookBorrowersSummary, BorrowerInfo, AuthorOut, CategoryOut,
    ScanLookupResponse, QRCodeResponse, PaginatedBookResponse, validate_isbn_string
)
from backend.app.routers.deps import get_current_user, get_optional_current_user, require_role
from backend.app.ai.content_based import content_recommender
from backend.app.ai.nlp_search import nlp_search_engine

router = APIRouter(prefix="/books", tags=["Books"])


def _generate_qr_data_url(payload: str) -> str:
    """Generate a clean Base64 PNG data URL for a QR code."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(payload)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_b64 = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/png;base64,{img_b64}"


def _format_book_out(book: Book, db: Session, user: Optional[User] = None) -> BookOut:
    avg_rating = db.query(func.avg(Rating.rating)).filter(Rating.book_id == book.id).scalar() or 0.0
    ratings_count = db.query(func.count(Rating.id)).filter(Rating.book_id == book.id).scalar() or 0
    borrow_count = db.query(func.count(Transaction.id)).filter(Transaction.book_id == book.id).scalar() or 0

    is_borrowed_by_me = False
    my_rating = None
    my_reaction = None

    if user:
        active_tx = db.query(Transaction).filter(
            Transaction.book_id == book.id,
            Transaction.user_id == user.id,
            Transaction.status.in_(["BORROWED", "OVERDUE"])
        ).first()
        is_borrowed_by_me = active_tx is not None

        user_rating = db.query(Rating).filter(Rating.book_id == book.id, Rating.user_id == user.id).first()
        if user_rating:
            my_rating = user_rating.rating

        user_feedback = db.query(Feedback).filter(Feedback.book_id == book.id, Feedback.user_id == user.id).first()
        if user_feedback:
            my_reaction = user_feedback.reaction

    avail = book.available_copies if book.available_copies is not None else book.total_copies
    computed_status = getattr(book, "status", None) or ("Available" if avail > 0 else "Currently Unavailable")

    return BookOut(
        id=book.id,
        title=book.title,
        author=AuthorOut(id=book.author.id, name=book.author.name, bio=book.author.bio),
        category=CategoryOut(
            id=book.category.id,
            name=book.category.name,
            slug=book.category.slug,
            icon=book.category.icon,
            description=book.category.description
        ),
        isbn=book.isbn,
        qr_code=book.qr_code or f"LIB-BOOK-{book.id:04d}",
        shelf_location=book.shelf_location or f"{getattr(book, 'shelf', 'Shelf A')}, {getattr(book, 'rack', 'Rack A-01')}",
        description=book.description,
        publisher=book.publisher,
        publication_year=book.publication_year,
        total_copies=book.total_copies,
        available_copies=avail,
        cover_image=book.cover_image,
        keywords=book.keywords,
        language=getattr(book, "language", "English") or "English",
        edition=getattr(book, "edition", None),
        source=getattr(book, "source", "Indian/Tamil Sample Library Dataset") or "Indian/Tamil Sample Library Dataset",
        building=getattr(book, "building", "Main Library Building") or "Main Library Building",
        floor=getattr(book, "floor", "1st Floor") or "1st Floor",
        section=getattr(book, "section", "General Academic Wing") or "General Academic Wing",
        shelf=getattr(book, "shelf", "Shelf A") or "Shelf A",
        rack=getattr(book, "rack", "Rack A-01") or "Rack A-01",
        status=computed_status,
        created_at=book.created_at,
        average_rating=round(float(avg_rating), 1),
        ratings_count=int(ratings_count),
        borrow_count=int(borrow_count),
        is_borrowed_by_me=is_borrowed_by_me,
        my_rating=my_rating,
        my_reaction=my_reaction
    )


def _apply_book_filters_and_sort(
    query,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    author_id: Optional[int] = None,
    language: Optional[str] = None,
    building: Optional[str] = None,
    floor: Optional[str] = None,
    section: Optional[str] = None,
    shelf: Optional[str] = None,
    rack: Optional[str] = None,
    availability: Optional[str] = None,
    available_only: Optional[bool] = False,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
    sort_by: Optional[str] = "title_asc",
    db: Optional[Session] = None
):
    from datetime import datetime

    if category_id:
        query = query.filter(Book.category_id == category_id)

    if author_id:
        query = query.filter(Book.author_id == author_id)

    if language and language.upper() != "ALL":
        if language.lower() == "indian":
            query = query.filter(or_(
                Book.language.in_(["Tamil", "Hindi", "Sanskrit", "Malayalam", "Telugu", "Kannada", "Bengali"]),
                Book.category.has(Category.name.ilike("%Indian%")),
                Book.category.has(Category.name.ilike("%Tamil%"))
            ))
        elif language.lower() == "other":
            query = query.filter(~Book.language.in_(["English", "Tamil"]))
        else:
            query = query.filter(Book.language.ilike(f"%{language}%"))

    if building:
        query = query.filter(Book.building.ilike(f"%{building}%"))

    if floor and floor.upper() != "ALL":
        query = query.filter(Book.floor.ilike(f"%{floor}%"))

    if section and section.upper() != "ALL":
        query = query.filter(Book.section.ilike(f"%{section}%"))

    if shelf:
        query = query.filter(Book.shelf.ilike(f"%{shelf}%"))

    if rack:
        query = query.filter(Book.rack.ilike(f"%{rack}%"))

    # Availability filter handling
    if availability and availability.lower() != "all":
        avail_mode = availability.lower()
        if avail_mode == "available":
            query = query.filter(Book.available_copies > 0)
        elif avail_mode == "borrowed":
            query = query.filter(Book.total_copies > Book.available_copies)
        elif avail_mode in ["unavailable", "currently unavailable"]:
            query = query.filter(Book.available_copies == 0)
        elif avail_mode == "overdue" and db is not None:
            now = datetime.utcnow()
            overdue_sub = db.query(Transaction.book_id).filter(
                Transaction.status == "BORROWED",
                Transaction.due_date < now
            ).subquery()
            query = query.filter(Book.id.in_(overdue_sub))
    elif available_only:
        query = query.filter(Book.available_copies > 0)

    # Publication year range
    if year_from:
        query = query.filter(Book.publication_year >= year_from)
    if year_to:
        query = query.filter(Book.publication_year <= year_to)

    # Search filter (title, isbn, keywords, publisher, author, description)
    if search:
        search_term = f"%{search.strip()}%"
        query = query.join(Author).filter(
            or_(
                Book.title.ilike(search_term),
                Book.isbn.ilike(search_term),
                Book.keywords.ilike(search_term),
                Book.publisher.ilike(search_term),
                Book.description.ilike(search_term),
                Author.name.ilike(search_term)
            )
        )

    # Sorting options
    if sort_by in ["title_asc", "title"]:
        query = query.order_by(asc(Book.title))
    elif sort_by == "title_desc":
        query = query.order_by(desc(Book.title))
    elif sort_by == "author_asc":
        query = query.join(Author).order_by(asc(Author.name))
    elif sort_by in ["newest", "year_desc"]:
        query = query.order_by(desc(Book.publication_year), desc(Book.created_at))
    elif sort_by in ["oldest", "year_asc"]:
        query = query.order_by(asc(Book.publication_year), asc(Book.created_at))
    elif sort_by in ["recently_added", "created_desc"]:
        query = query.order_by(desc(Book.created_at), desc(Book.id))
    elif sort_by in ["most_available", "available_desc"]:
        query = query.order_by(desc(Book.available_copies))
    elif sort_by in ["least_available", "available_asc"]:
        query = query.order_by(asc(Book.available_copies))
    elif sort_by == "rating" and db is not None:
        rating_sub = db.query(Rating.book_id, func.avg(Rating.rating).label("avg_r")).group_by(Rating.book_id).subquery()
        query = query.outerjoin(rating_sub, Book.id == rating_sub.c.book_id).order_by(desc(rating_sub.c.avg_r))
    elif sort_by in ["popularity", "most_borrowed"] and db is not None:
        borrow_sub = db.query(Transaction.book_id, func.count(Transaction.id).label("b_count")).group_by(Transaction.book_id).subquery()
        query = query.outerjoin(borrow_sub, Book.id == borrow_sub.c.book_id).order_by(desc(borrow_sub.c.b_count))
    else:
        query = query.order_by(asc(Book.title))

    return query


@router.get("/paginated", response_model=PaginatedBookResponse)
def get_books_paginated(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    author_id: Optional[int] = None,
    language: Optional[str] = Query(None, description="Language filter"),
    building: Optional[str] = None,
    floor: Optional[str] = None,
    section: Optional[str] = None,
    shelf: Optional[str] = None,
    rack: Optional[str] = None,
    availability: Optional[str] = Query(None, description="all, available, borrowed, unavailable, overdue"),
    available_only: Optional[bool] = False,
    year_from: Optional[int] = Query(None, description="Minimum publication year"),
    year_to: Optional[int] = Query(None, description="Maximum publication year"),
    sort_by: Optional[str] = Query("title_asc", description="title_asc, title_desc, author_asc, newest, oldest, recently_added, most_available, least_available, rating, popularity"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=5, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    query = db.query(Book)
    query = _apply_book_filters_and_sort(
        query=query,
        search=search,
        category_id=category_id,
        author_id=author_id,
        language=language,
        building=building,
        floor=floor,
        section=section,
        shelf=shelf,
        rack=rack,
        availability=availability,
        available_only=available_only,
        year_from=year_from,
        year_to=year_to,
        sort_by=sort_by,
        db=db
    )

    total_count = query.count()
    total_pages = max(1, (total_count + page_size - 1) // page_size)
    offset = (page - 1) * page_size

    books = query.offset(offset).limit(page_size).all()
    return PaginatedBookResponse(
        total_count=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        books=[_format_book_out(b, db, current_user) for b in books]
    )


@router.get("", response_model=List[BookOut])
def get_books(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    author_id: Optional[int] = None,
    language: Optional[str] = Query(None, description="Language filter (e.g. Tamil, English, Hindi, Sanskrit)"),
    building: Optional[str] = None,
    floor: Optional[str] = None,
    section: Optional[str] = None,
    shelf: Optional[str] = None,
    rack: Optional[str] = None,
    available_only: Optional[bool] = False,
    min_rating: Optional[float] = None,
    sort_by: Optional[str] = Query("title_asc", description="title_asc, title_desc, author_asc, newest, oldest, rating, popularity"),
    skip: int = 0,
    limit: int = 500,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    query = db.query(Book)
    query = _apply_book_filters_and_sort(
        query=query,
        search=search,
        category_id=category_id,
        author_id=author_id,
        language=language,
        building=building,
        floor=floor,
        section=section,
        shelf=shelf,
        rack=rack,
        available_only=available_only,
        sort_by=sort_by,
        db=db
    )

    books = query.offset(skip).limit(limit).all()
    return [_format_book_out(b, db, current_user) for b in books]


def _find_book_by_code(code: str, db: Session) -> Optional[Book]:
    """Helper to match a book by QR payload JSON, Book ID, QR identifier, ISBN-10/13, or Copy Barcode."""
    code = (code or "").strip()
    if not code:
        return None

    target_isbn = None
    target_book_id = None
    target_barcode = None

    # Check JSON QR payload
    if code.startswith("{") and code.endswith("}"):
        try:
            data = json.loads(code)
            target_isbn = data.get("isbn")
            target_book_id = data.get("book_id") or data.get("id")
            target_barcode = data.get("barcode") or data.get("copy_barcode")
        except Exception:
            pass

    # Match by BookCopy barcode
    if target_barcode:
        copy_match = db.query(BookCopy).filter(BookCopy.barcode.ilike(target_barcode)).first()
        if copy_match:
            return copy_match.book

    # Match by QR code string (e.g., "LIB-BOOK-0001")
    qr_match = db.query(Book).filter(Book.qr_code.ilike(code)).first()
    if qr_match:
        return qr_match

    # Match by Book ID
    if target_book_id or (code.isdigit() and len(code) <= 7):
        b_id = target_book_id or int(code)
        book_by_id = db.query(Book).filter(Book.id == b_id).first()
        if book_by_id:
            return book_by_id

    # Match by URL (e.g. http://.../student/books/12 or /books/12)
    url_match = re.search(r"/books/(?:details/)?(\d+)", code, re.IGNORECASE)
    if url_match:
        b_id = int(url_match.group(1))
        book_by_url = db.query(Book).filter(Book.id == b_id).first()
        if book_by_url:
            return book_by_url

    # Match by Copy barcode directly (e.g. "BC-0001-01")
    if code.upper().startswith("BC-"):
        copy_direct = db.query(BookCopy).filter(BookCopy.barcode.ilike(code)).first()
        if copy_direct:
            return copy_direct.book

    # Match by ISBN (with or without hyphens)
    isbn_to_search = target_isbn or code
    clean_numeric = re.sub(r"[^0-9X-]", "", isbn_to_search.upper())
    clean_no_hyphens = clean_numeric.replace("-", "")

    all_books = db.query(Book).all()
    for b in all_books:
        b_clean = b.isbn.replace("-", "").strip().upper()
        if b.isbn.strip().upper() == isbn_to_search.upper() or (clean_no_hyphens and b_clean == clean_no_hyphens):
            return b

    return None


@router.get("/isbn/{isbn:path}", response_model=BookDetailOut)
def get_book_by_isbn(
    isbn: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Direct lookup of a book by ISBN-10 or ISBN-13 (with or without hyphens)."""
    clean_isbn = isbn.strip().replace(" ", "")
    clean_no_hyphens = re.sub(r"[^0-9X]", "", clean_isbn.upper())

    all_books = db.query(Book).all()
    matched_book = None
    for b in all_books:
        b_clean = re.sub(r"[^0-9X]", "", b.isbn.upper())
        if b.isbn.strip().upper() == clean_isbn.upper() or (clean_no_hyphens and b_clean == clean_no_hyphens):
            matched_book = b
            break

    if not matched_book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No book found in catalog with ISBN: '{isbn}'."
        )

    # Similar books via content recommender
    if content_recommender.tfidf_matrix is None:
        content_recommender.fit(db)

    similar_tuples = content_recommender.get_similar_books(matched_book.id, top_n=4)
    similar_books = []
    for s_id, score, reason in similar_tuples:
        s_book = db.query(Book).filter(Book.id == s_id).first()
        if s_book:
            similar_books.append(_format_book_out(s_book, db, current_user))

    base_out = _format_book_out(matched_book, db, current_user)
    return BookDetailOut(
        **base_out.dict(),
        similar_books=similar_books
    )


@router.get("/scan/{raw_code:path}", response_model=ScanLookupResponse)
def scan_lookup(
    raw_code: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Scan and look up book by QR Code, ISBN-10/13, Copy Barcode, or Book ID."""
    code = (raw_code or "").strip()
    if not code:
        raise HTTPException(status_code=400, detail="Empty scan code provided.")

    book = _find_book_by_code(code, db)

    if book:
        # Collect active borrowers
        active_txs = (
            db.query(Transaction)
            .filter(Transaction.book_id == book.id, Transaction.status.in_(["BORROWED", "OVERDUE"]))
            .order_by(Transaction.borrow_date.desc())
            .all()
        )
        active_borrowers = [
            BorrowerInfo(
                user_id=t.user.id,
                user_name=t.user.name,
                user_email=t.user.email,
                department=t.user.department,
                borrow_date=t.borrow_date,
                due_date=t.due_date,
                return_date=t.return_date,
                status=t.status,
                fine_amount=t.fine_amount or 0.0
            )
            for t in active_txs
        ]

        book_out = _format_book_out(book, db, current_user)
        return ScanLookupResponse(
            success=True,
            scan_type="QR_CODE" if "LIB-BOOK" in code.upper() or code.startswith("{") else "ISBN" if "-" in code or len(code) in [10, 13] else "BOOK_ID",
            raw_code=code,
            found_locally=True,
            book=book_out,
            shelf_location=book.shelf_location or "Rack A-01",
            active_borrowers=active_borrowers,
            message=f"Found book '{book.title}' (ISBN: {book.isbn}) located at {book.shelf_location or 'Rack A-01'}."
        )

    # If not found locally, try fetching external metadata via Open Library if ISBN
    clean_no_hyphens = re.sub(r"[^0-9X]", "", code.upper())
    external_data = None
    if len(clean_no_hyphens) in [10, 13]:
        try:
            url = f"https://openlibrary.org/api/books?bibkeys=ISBN:{clean_no_hyphens}&format=json&jscmd=data"
            with httpx.Client(timeout=3.0) as client:
                res = client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    key = f"ISBN:{clean_no_hyphens}"
                    if key in data:
                        book_info = data[key]
                        authors = ", ".join([a.get("name", "") for a in book_info.get("authors", [])])
                        publishers = ", ".join([p.get("name", "") for a in book_info.get("publishers", [])])
                        cover = book_info.get("cover", {}).get("medium") or book_info.get("cover", {}).get("large")
                        external_data = {
                            "title": book_info.get("title"),
                            "author_name": authors or "Unknown Author",
                            "publisher": publishers or "",
                            "publication_year": int(book_info.get("publish_date", "2020")[:4]) if book_info.get("publish_date") and book_info.get("publish_date")[:4].isdigit() else 2024,
                            "cover_image": cover,
                            "isbn": code
                        }
        except Exception:
            pass

    if external_data:
        return ScanLookupResponse(
            success=True,
            scan_type="ISBN",
            raw_code=code,
            found_locally=False,
            external_data=external_data,
            message=f"Book not in library inventory yet, but metadata retrieved for '{external_data.get('title')}'."
        )

    return ScanLookupResponse(
        success=False,
        scan_type="UNKNOWN",
        raw_code=code,
        found_locally=False,
        message=f"No matching book or copy found for scanned code: '{code}'."
    )


@router.post("/scan-qr", response_model=ScanLookupResponse)
def scan_qr_post(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """POST endpoint for QR scanner payload processing."""
    raw_code = payload.get("qr_code") or payload.get("raw_code") or payload.get("code") or ""
    return scan_lookup(raw_code=str(raw_code), db=db, current_user=current_user)


@router.get("/{book_id}/qr", response_model=QRCodeResponse)
def get_book_qr_code(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Generate and return unique QR code metadata and high-resolution Base64 PNG image for a book."""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found.")

    if not book.qr_code:
        book.qr_code = f"LIB-BOOK-{book.id:04d}"
        db.commit()
        db.refresh(book)

    # QR payload contains only non-sensitive book identifier
    qr_payload = json.dumps({
        "type": "LIB_BOOK",
        "book_id": book.id,
        "isbn": book.isbn,
        "qr_code": book.qr_code
    })

    qr_image_data = _generate_qr_data_url(qr_payload)

    return QRCodeResponse(
        book_id=book.id,
        title=book.title,
        author_name=book.author.name if book.author else "Unknown Author",
        isbn=book.isbn,
        shelf_location=book.shelf_location or "Rack A-01",
        qr_code=book.qr_code,
        qr_payload=qr_payload,
        qr_image_data=qr_image_data,
        created_at=book.created_at
    )


@router.get("/{book_id}", response_model=BookDetailOut)
def get_book_details(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found.")

    # Record dwell/view for behaviour analysis
    if current_user:
        view_entry = BookView(user_id=current_user.id, book_id=book.id, dwell_seconds=15)
        db.add(view_entry)
        db.commit()

    # Find similar books using content-based recommender
    if content_recommender.tfidf_matrix is None:
        content_recommender.fit(db)

    similar_tuples = content_recommender.get_similar_books(book.id, top_n=4)
    similar_books = []
    for s_id, score, reason in similar_tuples:
        s_book = db.query(Book).filter(Book.id == s_id).first()
        if s_book:
            similar_books.append(_format_book_out(s_book, db, current_user))

    base_out = _format_book_out(book, db, current_user)
    return BookDetailOut(
        **base_out.dict(),
        similar_books=similar_books
    )


@router.post("", response_model=BookOut, status_code=status.HTTP_201_CREATED)
def create_book(
    book_in: BookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["librarian", "admin"]))
):
    # Validate ISBN-10 or ISBN-13 format & checksum
    clean_isbn = book_in.isbn.strip()
    try:
        clean_isbn = validate_isbn_string(clean_isbn)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Check duplicate ISBN
    existing = db.query(Book).filter(
        or_(
            Book.isbn == clean_isbn,
            Book.isbn == clean_isbn.replace("-", "")
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A book with ISBN '{clean_isbn}' already exists in inventory (Title: '{existing.title}')."
        )

    # Find or create Author
    author = db.query(Author).filter(Author.name.ilike(book_in.author_name.strip())).first()
    if not author:
        author = Author(name=book_in.author_name.strip())
        db.add(author)
        db.commit()
        db.refresh(author)

    # Validate Category
    category = db.query(Category).filter(Category.id == book_in.category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category ID.")

    # Physical location fields
    building = book_in.building or "Main Library Building"
    floor = book_in.floor or "1st Floor"
    section = book_in.section or (f"{category.name} Wing" if category else "General Academic Wing")
    shelf = book_in.shelf or "Shelf A"
    rack = book_in.rack or "Rack A-01"
    shelf_loc = book_in.shelf_location or f"{shelf}, {rack}"
    copies_count = book_in.total_copies if book_in.total_copies and book_in.total_copies > 0 else 5

    new_book = Book(
        title=book_in.title.strip(),
        author_id=author.id,
        category_id=category.id,
        isbn=clean_isbn,
        shelf_location=shelf_loc,
        description=book_in.description.strip(),
        publisher=book_in.publisher or "Academic Press",
        publication_year=book_in.publication_year or 2024,
        total_copies=copies_count,
        available_copies=book_in.available_copies or copies_count,
        cover_image=book_in.cover_image or "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80",
        keywords=book_in.keywords or f"{book_in.title}, {author.name}, {category.name}",
        language=book_in.language or "English",
        edition=book_in.edition or "1st Edition",
        source=book_in.source or "College Library Catalog",
        building=building,
        floor=floor,
        section=section,
        shelf=shelf,
        rack=rack,
        status="Available"
    )
    db.add(new_book)
    db.commit()
    db.refresh(new_book)

    # Set unique QR code identifier
    new_book.qr_code = f"BOOK-CBE-{new_book.id:05d}"
    db.commit()

    # Generate BookCopy records
    for i in range(1, new_book.total_copies + 1):
        copy = BookCopy(
            book_id=new_book.id,
            barcode=f"BOOK-CBE-{new_book.id:05d}-C{i:02d}",
            status="AVAILABLE"
        )
        db.add(copy)
    db.commit()

    # Refit recommendation and semantic search engines live
    try:
        content_recommender.fit(db)
    except Exception as e:
        print("Re-fit warning:", e)

    return _format_book_out(new_book, db, current_user)


@router.put("/{book_id}", response_model=BookOut)
def update_book(
    book_id: int,
    book_in: BookUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["librarian", "admin"]))
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found.")

    if book_in.isbn:
        clean_isbn = book_in.isbn.strip()
        try:
            clean_isbn = validate_isbn_string(clean_isbn)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

        duplicate = db.query(Book).filter(Book.isbn == clean_isbn, Book.id != book.id).first()
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Another book '{duplicate.title}' already uses ISBN '{clean_isbn}'."
            )
        book.isbn = clean_isbn

    if book_in.shelf_location:
        book.shelf_location = book_in.shelf_location.strip()
    if book_in.title:
        book.title = book_in.title.strip()
    if book_in.description:
        book.description = book_in.description.strip()
    if book_in.publisher:
        book.publisher = book_in.publisher
    if book_in.publication_year:
        book.publication_year = book_in.publication_year
    if book_in.cover_image:
        book.cover_image = book_in.cover_image
    if book_in.keywords:
        book.keywords = book_in.keywords
    if book_in.category_id:
        book.category_id = book_in.category_id

    if book_in.author_name:
        author = db.query(Author).filter(Author.name.ilike(book_in.author_name.strip())).first()
        if not author:
            author = Author(name=book_in.author_name.strip())
            db.add(author)
            db.commit()
            db.refresh(author)
        book.author_id = author.id

    if book_in.total_copies is not None and book_in.total_copies != book.total_copies:
        diff = book_in.total_copies - book.total_copies
        book.total_copies = book_in.total_copies
        book.available_copies = max(0, book.available_copies + diff)

    db.commit()
    db.refresh(book)

    content_recommender.fit(db)
    return _format_book_out(book, db, current_user)


@router.delete("/{book_id}")
def delete_book(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["librarian", "admin"]))
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found.")

    # Check active loans
    active_loans = db.query(Transaction).filter(
        Transaction.book_id == book.id,
        Transaction.status.in_(["BORROWED", "OVERDUE"])
    ).count()

    if active_loans > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete book. There are {active_loans} active borrowing transaction(s) pending return."
        )

    db.delete(book)
    db.commit()
    content_recommender.fit(db)
    return {"message": "Book deleted successfully."}


@router.get("/{book_id}/borrowers", response_model=BookBorrowersSummary)
def get_book_borrowers(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["librarian", "admin"]))
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found.")

    transactions = db.query(Transaction).filter(Transaction.book_id == book.id).order_by(desc(Transaction.borrow_date)).all()

    current_borrowers = []
    return_history = []

    for t in transactions:
        info = BorrowerInfo(
            user_id=t.user.id,
            user_name=t.user.name,
            user_email=t.user.email,
            department=t.user.department,
            borrow_date=t.borrow_date,
            due_date=t.due_date,
            return_date=t.return_date,
            status=t.status,
            fine_amount=t.fine_amount or 0.0
        )
        if t.status in ["BORROWED", "OVERDUE"]:
            current_borrowers.append(info)
        else:
            return_history.append(info)

    borrowed_copies = book.total_copies - book.available_copies

    return BookBorrowersSummary(
        book_id=book.id,
        book_title=book.title,
        total_copies=book.total_copies,
        available_copies=book.available_copies,
        borrowed_copies=borrowed_copies,
        current_borrowers=current_borrowers,
        return_history=return_history
    )
