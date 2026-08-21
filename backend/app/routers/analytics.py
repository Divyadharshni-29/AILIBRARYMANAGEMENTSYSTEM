from datetime import datetime, timedelta
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from backend.app.database import get_db
from backend.app.models.entities import (
    Book, User, Transaction, Category, Fine, Rating
)
from backend.app.schemas.schemas import LibraryAnalytics
from backend.app.routers.deps import require_role
from backend.app.ai.demand_forecasting import demand_forecaster

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=LibraryAnalytics)
def get_library_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["librarian", "admin"]))
):
    now = datetime.utcnow()

    # 1. High level KPIs
    total_books = db.query(Book).count()
    total_copies = db.query(func.sum(Book.total_copies)).scalar() or 0
    available_copies = db.query(func.sum(Book.available_copies)).scalar() or 0
    borrowed_copies = total_copies - available_copies

    # Dynamic Indian, Tamil & Technical book counts
    tamil_books_count = db.query(Book).filter(
        (Book.language == "Tamil") |
        (Book.category.has(Category.name.ilike("%Tamil%")))
    ).count()

    indian_books_count = db.query(Book).filter(
        (Book.language.in_(["Tamil", "Hindi", "Sanskrit", "Malayalam", "Telugu", "Kannada", "Bengali"])) |
        (Book.category.has(Category.name.ilike("%Indian%"))) |
        (Book.category.has(Category.name.ilike("%Tamil%")))
    ).count()

    technical_books_count = db.query(Book).filter(
        Book.category.has(Category.name.in_([
            "AI & Machine Learning",
            "Computer Science & Programming",
            "Software Engineering & Web",
            "Software Engineering",
            "Data Science & Analytics",
            "Cloud & DevOps",
            "Cybersecurity",
            "Mathematics & Statistics"
        ]))
    ).count()

    total_users = db.query(User).filter(User.role.has(name="student")).count()
    active_borrowers = (
        db.query(Transaction.user_id)
        .filter(Transaction.status.in_(["BORROWED", "OVERDUE"]))
        .distinct()
        .count()
    )
    overdue_count = (
        db.query(Transaction)
        .filter(Transaction.status == "BORROWED", Transaction.due_date < now)
        .count()
    )
    total_transactions = db.query(Transaction).count()

    total_fines_collected = db.query(func.sum(Fine.amount)).filter(Fine.status == "PAID").scalar() or 0.0

    # 2. Borrows by month (last 6 months)
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    borrows_by_month_dict = {}
    for i in range(5, -1, -1):
        target_month_date = now - timedelta(days=i * 30)
        key = f"{month_names[target_month_date.month - 1]} {target_month_date.year}"
        borrows_by_month_dict[key] = {"month": key, "borrows": 0, "returns": 0}

    transactions = db.query(Transaction).all()
    for t in transactions:
        m_key = f"{month_names[t.borrow_date.month - 1]} {t.borrow_date.year}"
        if m_key in borrows_by_month_dict:
            borrows_by_month_dict[m_key]["borrows"] += 1
        if t.return_date:
            ret_key = f"{month_names[t.return_date.month - 1]} {t.return_date.year}"
            if ret_key in borrows_by_month_dict:
                borrows_by_month_dict[ret_key]["returns"] += 1

    borrows_by_month = list(borrows_by_month_dict.values())

    # 3. Popular genres
    genre_counts = (
        db.query(Category.name, func.count(Transaction.id))
        .join(Book, Book.category_id == Category.id)
        .join(Transaction, Transaction.book_id == Book.id)
        .group_by(Category.name)
        .order_by(desc(func.count(Transaction.id)))
        .all()
    )
    popular_genres = [{"genre": g[0], "borrow_count": g[1]} for g in genre_counts]

    # 4. Most borrowed books
    top_books = (
        db.query(Book.id, Book.title, Category.name, func.count(Transaction.id))
        .join(Category, Book.category_id == Category.id)
        .join(Transaction, Transaction.book_id == Book.id)
        .group_by(Book.id, Book.title, Category.name)
        .order_by(desc(func.count(Transaction.id)))
        .limit(10)
        .all()
    )
    most_borrowed_books = [
        {"book_id": b[0], "title": b[1], "category": b[2], "borrow_count": b[3]}
        for b in top_books
    ]

    # 5. Return trends
    on_time_returns = db.query(Transaction).filter(
        Transaction.status == "RETURNED",
        Transaction.return_date <= Transaction.due_date
    ).count()
    late_returns = db.query(Transaction).filter(
        Transaction.status == "RETURNED",
        Transaction.return_date > Transaction.due_date
    ).count()
    currently_active = db.query(Transaction).filter(Transaction.status == "BORROWED").count()

    return_trends = [
        {"name": "On-Time Returns", "value": on_time_returns, "color": "#10B981"},
        {"name": "Late Returns", "value": late_returns, "color": "#F59E0B"},
        {"name": "Currently Active", "value": currently_active, "color": "#6366F1"},
        {"name": "Overdue Pending", "value": overdue_count, "color": "#EF4444"}
    ]

    # 6. Active users
    active_user_query = (
        db.query(User.id, User.name, User.email, User.department, func.count(Transaction.id))
        .join(Transaction, Transaction.user_id == User.id)
        .group_by(User.id, User.name, User.email, User.department)
        .order_by(desc(func.count(Transaction.id)))
        .limit(8)
        .all()
    )
    active_users = [
        {"user_id": u[0], "name": u[1], "email": u[2], "department": u[3], "total_borrows": u[4]}
        for u in active_user_query
    ]

    # 7. AI Demand Forecasts
    genre_demands = demand_forecaster.predict_genre_demands(db)
    book_demands = demand_forecaster.predict_book_demands(db, top_n=10)

    return LibraryAnalytics(
        total_books=total_books,
        total_copies=int(total_copies),
        available_copies=int(available_copies),
        borrowed_copies=int(borrowed_copies),
        indian_books_count=int(indian_books_count),
        tamil_books_count=int(tamil_books_count),
        technical_books_count=int(technical_books_count),
        total_users=total_users,
        active_borrowers=active_borrowers,
        overdue_count=overdue_count,
        total_transactions=total_transactions,
        total_fines_collected=round(float(total_fines_collected), 2),
        borrows_by_month=borrows_by_month,
        popular_genres=popular_genres,
        most_borrowed_books=most_borrowed_books,
        return_trends=return_trends,
        active_users=active_users,
        genre_demand_predictions=genre_demands,
        book_demand_predictions=book_demands
    )
