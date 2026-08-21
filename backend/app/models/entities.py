import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from backend.app.database import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)  # "student", "librarian", "admin"
    description = Column(String(255), nullable=True)

    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    department = Column(String(100), nullable=True)
    year = Column(String(20), nullable=True)
    student_id = Column(String(50), unique=True, nullable=True, index=True)
    phone = Column(String(30), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    role = relationship("Role", back_populates="users")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    ratings = relationship("Rating", back_populates="user", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="user", cascade="all, delete-orphan")
    search_history = relationship("SearchHistory", back_populates="user", cascade="all, delete-orphan")
    book_views = relationship("BookView", back_populates="user", cascade="all, delete-orphan")
    preference = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")
    recommendation_feedbacks = relationship("RecommendationFeedback", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="user", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False)
    icon = Column(String(50), default="Book")
    description = Column(Text, nullable=True)

    books = relationship("Book", back_populates="category")


class Author(Base):
    __tablename__ = "authors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False, index=True)
    bio = Column(Text, nullable=True)

    books = relationship("Book", back_populates="author")


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("authors.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    isbn = Column(String(30), unique=True, nullable=False, index=True)
    qr_code = Column(String(100), unique=True, nullable=True, index=True)
    shelf_location = Column(String(100), default="Rack A-01", nullable=True)
    description = Column(Text, nullable=False)
    publisher = Column(String(150), nullable=True)
    publication_year = Column(Integer, nullable=True)
    total_copies = Column(Integer, default=5, nullable=False)
    available_copies = Column(Integer, default=5, nullable=False)
    cover_image = Column(String(500), nullable=True)
    keywords = Column(String(500), nullable=True)
    language = Column(String(50), default="English", nullable=True, index=True)
    edition = Column(String(50), nullable=True)
    source = Column(String(100), default="Indian/Tamil Sample Library Dataset", nullable=True)
    building = Column(String(100), default="Main Library Building", nullable=True)
    floor = Column(String(50), default="1st Floor", nullable=True, index=True)
    section = Column(String(100), default="General Academic Wing", nullable=True, index=True)
    shelf = Column(String(50), default="Shelf A", nullable=True)
    rack = Column(String(50), default="Rack A-01", nullable=True)
    status = Column(String(50), default="Available", nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    author = relationship("Author", back_populates="books")
    category = relationship("Category", back_populates="books")
    copies = relationship("BookCopy", back_populates="book", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="book", cascade="all, delete-orphan")
    ratings = relationship("Rating", back_populates="book", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="book", cascade="all, delete-orphan")
    book_views = relationship("BookView", back_populates="book", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="book", cascade="all, delete-orphan")
    recommendation_feedbacks = relationship("RecommendationFeedback", back_populates="book", cascade="all, delete-orphan")


class BookCopy(Base):
    __tablename__ = "book_copies"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    barcode = Column(String(50), unique=True, nullable=False, index=True)
    status = Column(String(30), default="AVAILABLE", nullable=False)  # AVAILABLE, BORROWED, MAINTENANCE, LOST

    book = relationship("Book", back_populates="copies")
    transactions = relationship("Transaction", back_populates="copy")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False, index=True)
    copy_id = Column(Integer, ForeignKey("book_copies.id"), nullable=True)
    borrow_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    due_date = Column(DateTime, nullable=False)
    return_date = Column(DateTime, nullable=True)
    status = Column(String(30), default="BORROWED", nullable=False, index=True)  # BORROWED, RETURNED, OVERDUE
    fine_amount = Column(Float, default=0.0)
    fine_paid = Column(Boolean, default=False)

    user = relationship("User", back_populates="transactions")
    book = relationship("Book", back_populates="transactions")
    copy = relationship("BookCopy", back_populates="transactions")
    fines = relationship("Fine", back_populates="transaction", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="transaction", cascade="all, delete-orphan")


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False, index=True)
    rating = Column(Float, nullable=False)  # 1.0 to 5.0
    review = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="ratings")
    book = relationship("Book", back_populates="ratings")


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False, index=True)
    reaction = Column(String(20), nullable=False)  # LIKE, DISLIKE
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="feedbacks")
    book = relationship("Book", back_populates="feedbacks")


class SearchHistory(Base):
    __tablename__ = "search_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    query = Column(String(255), nullable=False)
    search_type = Column(String(30), default="EXACT")  # EXACT, NLP_SEMANTIC
    results_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="search_history")


class BookView(Base):
    __tablename__ = "book_views"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False, index=True)
    dwell_seconds = Column(Integer, default=10)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="book_views")
    book = relationship("Book", back_populates="book_views")


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    genre_scores_json = Column(Text, default="{}")  # {"AI": 0.9, "Data Science": 0.85}
    initial_interests_json = Column(Text, default="[]")  # ["Programming", "AI"]
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="preference")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False, index=True)
    model_type = Column(String(50), default="HYBRID")  # CONTENT, COLLAB, HYBRID, COLD_START, POPULARITY
    score = Column(Float, nullable=False)
    reason = Column(String(500), nullable=False)
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="recommendations")
    book = relationship("Book", back_populates="recommendations")


class RecommendationFeedback(Base):
    __tablename__ = "recommendation_feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False, index=True)
    action = Column(String(30), nullable=False)  # CLICKED, LIKED, DISLIKED, BORROWED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="recommendation_feedbacks")
    book = relationship("Book", back_populates="recommendation_feedbacks")


class Fine(Base):
    __tablename__ = "fines"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(30), default="UNPAID")  # UNPAID, PAID, WAIVED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)

    transaction = relationship("Transaction", back_populates="fines")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False, index=True)  # REMINDER_3_DAYS, REMINDER_2_DAYS, REMINDER_1_DAY, DUE_TODAY, OVERDUE, GENERAL, BOOK_RETURNED
    due_date = Column(DateTime, nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    user = relationship("User", back_populates="notifications")
    book = relationship("Book")
    transaction = relationship("Transaction")


class ModelEvaluation(Base):
    __tablename__ = "model_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False)  # Baseline Hybrid, Tuned Hybrid, Content-Based, Collaborative
    metrics_json = Column(Text, nullable=False)  # {"precision_at_k": 0.72, "recall_at_k": 0.68, "ndcg_at_k": 0.79, "f1_score": 0.70}
    is_baseline = Column(Boolean, default=False)
    parameters_json = Column(Text, default="{}")  # {"content_w": 0.4, "collab_w": 0.3, ...}
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False, index=True)
    fine_id = Column(Integer, ForeignKey("fines.id"), nullable=True, index=True)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), nullable=False)  # GPAY, PHONEPE, PAYTM, UPI_QR, UPI_ID, CARD, NETBANKING
    reference_id = Column(String(100), unique=True, nullable=False, index=True)  # TXN-YYYYMMDD-XXXXXX
    upi_vpa = Column(String(100), nullable=True)  # e.g., user@okhdfcbank
    gateway_order_id = Column(String(100), nullable=True, index=True)
    gateway_payment_id = Column(String(100), nullable=True)
    gateway_signature = Column(String(255), nullable=True)
    status = Column(String(30), default="PENDING", nullable=False, index=True)  # PENDING, SUCCESSFUL, FAILED, CANCELLED, REFUNDED
    receipt_number = Column(String(100), unique=True, nullable=False, index=True)  # REC-YYYYMMDD-XXXXXX
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    user = relationship("User", back_populates="payments")
    book = relationship("Book")
    transaction = relationship("Transaction", back_populates="payments")
    fine = relationship("Fine")


class LibraryLocation(Base):
    __tablename__ = "library_locations"

    id = Column(Integer, primary_key=True, index=True)
    building = Column(String(100), default="Main Library Building", nullable=False)
    floor = Column(String(50), default="1st Floor", nullable=False, index=True)
    section = Column(String(100), nullable=False, index=True)  # e.g., "Computer Science Section"
    shelf = Column(String(50), nullable=False)  # e.g., "Shelf A"
    rack = Column(String(50), nullable=False)  # e.g., "Rack A-12"
    description = Column(String(255), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    category = relationship("Category")
