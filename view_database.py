import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from sqlalchemy import func
from backend.app.database import SessionLocal
from backend.app.models.entities import (
    User, Role, Book, BookCopy, Category, Transaction, Notification, Payment, LibraryLocation
)


def print_header(title):
    print("\n" + "=" * 70)
    print(f" 📊 {title}")
    print("=" * 70)


def show_summary():
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        role_counts = db.query(Role.name, func.count(User.id)).join(User, isouter=True).group_by(Role.name).all()
        book_count = db.query(Book).count()
        copy_count = db.query(BookCopy).count()
        available_copies = db.query(func.sum(Book.available_copies)).scalar() or 0
        cat_count = db.query(Category).count()
        active_loans = db.query(Transaction).filter(Transaction.status == "BORROWED").count()
        total_tx = db.query(Transaction).count()
        notifications = db.query(Notification).count()
        payments = db.query(Payment).count()
        locations = db.query(LibraryLocation).count()

        print_header("AI COLLEGE LIBRARY MANAGEMENT SYSTEM — DATABASE STORE OVERVIEW")
        print(f"📁 Database Location:  c:\\Users\\divya\\OneDrive\\Desktop\\AI Library Management System\\ai_library.db")
        print("-" * 70)
        print(f"👥 Total Users:            {user_count} registered users")
        for rname, cnt in role_counts:
            print(f"   • {rname.capitalize():<12}: {cnt} users")
        print(f"📚 Total Master Books:     {book_count} books")
        print(f"📦 Total Physical Copies:  {copy_count} physical copies")
        print(f"✨ Available for Loan:     {available_copies} copies")
        print(f"🏷️ Categories:             {cat_count} categories")
        print(f"📍 Floor Locations:        {locations} physical library zones")
        print(f"📖 Active Loans:           {active_loans} currently borrowed")
        print(f"📜 Total Transactions:     {total_tx} historical loan events")
        print(f"🔔 Notifications:          {notifications} reminder logs")
        print(f"💰 Payment Records:        {payments} transaction payments")
        print("=" * 70)

        # Show Users Table
        print_header("REGISTERED USERS & DEMO PROFILES (Sample / All)")
        users = db.query(User).order_by(User.id.desc()).limit(10).all()
        print(f"{'ID':<4} | {'Name':<20} | {'Email':<30} | {'Role':<10} | {'Student ID':<15}")
        print("-" * 88)
        for u in reversed(users):
            rname = u.role.name if u.role else "student"
            sid = u.student_id or "-"
            print(f"{u.id:<4} | {u.name[:20]:<20} | {u.email[:30]:<30} | {rname:<10} | {sid:<15}")

        # Show Books Table Sample
        print_header("LATEST MASTER BOOKS CATALOG (Sample 8 of 893)")
        books = db.query(Book).order_by(Book.id.desc()).limit(8).all()
        print(f"{'ID':<4} | {'Title':<32} | {'Author':<20} | {'Copies':<8} | {'Floor/Shelf':<15}")
        print("-" * 88)
        for b in reversed(books):
            author_name = b.author.name if b.author else "Unknown Author"
            loc = f"F:{b.floor} S:{b.shelf}" if b.floor else "Main Stack"
            copies = f"{b.available_copies}/{b.total_copies}"
            print(f"{b.id:<4} | {b.title[:32]:<32} | {author_name[:20]:<20} | {copies:<8} | {loc:<15}")

        print("\n" + "=" * 70)
        print("💡 HOW TO VIEW YOUR DATABASE:")
        print(" 1. Web Admin UI: Open http://localhost:5173/login (login: admin@library.com / admin123)")
        print(" 2. Fast API Swagger: Open http://localhost:8000/docs")
        print(" 3. SQLite Viewer Tool: Open 'ai_library.db' with DB Browser for SQLite or VS Code Extension")
        print("=" * 70 + "\n")

    finally:
        db.close()


if __name__ == "__main__":
    show_summary()
