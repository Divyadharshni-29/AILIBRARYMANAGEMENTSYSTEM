from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# ==================== Auth & User Schemas ====================

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    student_id: Optional[str] = Field(None, max_length=50)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=30)
    department: Optional[str] = "Computer Science"
    year: Optional[str] = "3rd Year"
    password: str = Field(..., min_length=8)
    confirm_password: Optional[str] = None
    role: Optional[str] = "student"  # default to student


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = None


class GoogleDemoAuthRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    department: Optional[str] = "Computer Science"
    year: Optional[str] = "1st Year"


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    student_id: Optional[str] = None
    phone: Optional[str] = None
    role: str
    department: Optional[str] = None
    year: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    student_id: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    year: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[str] = None


# ==================== Category & Author Schemas ====================

class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    icon: Optional[str] = "Book"
    description: Optional[str] = None
    book_count: Optional[int] = 0

    class Config:
        from_attributes = True


class CategoryCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    icon: Optional[str] = "Book"
    description: Optional[str] = None


class AuthorOut(BaseModel):
    id: int
    name: str
    bio: Optional[str] = None

    class Config:
        from_attributes = True


import re


def is_valid_isbn_10(isbn: str) -> bool:
    clean = re.sub(r"[^0-9X]", "", isbn.upper())
    if len(clean) != 10:
        return False
    total = 0
    for i in range(9):
        if not clean[i].isdigit():
            return False
        total += int(clean[i]) * (10 - i)
    check = 10 if clean[9] == 'X' else int(clean[9]) if clean[9].isdigit() else -1
    if check == -1:
        return False
    total += check
    return total % 11 == 0


def is_valid_isbn_13(isbn: str) -> bool:
    clean = re.sub(r"[^0-9]", "", isbn)
    if len(clean) != 13:
        return False
    if not (clean.startswith("978") or clean.startswith("979")):
        return False
    total = sum(int(clean[i]) * (1 if i % 2 == 0 else 3) for i in range(12))
    check = (10 - (total % 10)) % 10
    return check == int(clean[12])


def validate_isbn_string(isbn_str: str) -> str:
    clean = isbn_str.strip()
    if is_valid_isbn_10(clean) or is_valid_isbn_13(clean):
        return clean
    raise ValueError(f"Invalid ISBN format or checksum: '{isbn_str}'. Must be a valid ISBN-10 or ISBN-13 (e.g. 978-0134685991).")


# ==================== Book Schemas ====================

class BookBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    author_name: str
    category_id: int
    isbn: str = Field(..., min_length=5, max_length=30)
    shelf_location: Optional[str] = Field(default="Rack A-01", max_length=100)
    description: str
    publisher: Optional[str] = None
    publication_year: Optional[int] = None
    total_copies: int = Field(default=5, ge=1)
    available_copies: Optional[int] = None
    cover_image: Optional[str] = None
    keywords: Optional[str] = None
    language: Optional[str] = "English"
    edition: Optional[str] = None
    source: Optional[str] = "Indian/Tamil Sample Library Dataset"
    building: Optional[str] = "Main Library Building"
    floor: Optional[str] = "1st Floor"
    section: Optional[str] = "General Academic Wing"
    shelf: Optional[str] = "Shelf A"
    rack: Optional[str] = "Rack A-01"
    status: Optional[str] = "Available"

    @classmethod
    def validate_isbn_field(cls, v: str) -> str:
        return validate_isbn_string(v)


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author_name: Optional[str] = None
    category_id: Optional[int] = None
    isbn: Optional[str] = None
    shelf_location: Optional[str] = None
    description: Optional[str] = None
    publisher: Optional[str] = None
    publication_year: Optional[int] = None
    total_copies: Optional[int] = None
    available_copies: Optional[int] = None
    cover_image: Optional[str] = None
    keywords: Optional[str] = None
    language: Optional[str] = None
    edition: Optional[str] = None
    source: Optional[str] = None
    building: Optional[str] = None
    floor: Optional[str] = None
    section: Optional[str] = None
    shelf: Optional[str] = None
    rack: Optional[str] = None
    status: Optional[str] = None


class BookOut(BaseModel):
    id: int
    title: str
    author: AuthorOut
    category: CategoryOut
    isbn: str
    qr_code: Optional[str] = None
    shelf_location: Optional[str] = "Rack A-01"
    description: str
    publisher: Optional[str] = None
    publication_year: Optional[int] = None
    total_copies: int
    available_copies: int
    cover_image: Optional[str] = None
    keywords: Optional[str] = None
    language: Optional[str] = "English"
    edition: Optional[str] = None
    source: Optional[str] = "Indian/Tamil Sample Library Dataset"
    building: Optional[str] = "Main Library Building"
    floor: Optional[str] = "1st Floor"
    section: Optional[str] = "General Academic Wing"
    shelf: Optional[str] = "Shelf A"
    rack: Optional[str] = "Rack A-01"
    status: Optional[str] = "Available"
    created_at: datetime
    average_rating: Optional[float] = 0.0
    ratings_count: Optional[int] = 0
    borrow_count: Optional[int] = 0
    is_borrowed_by_me: Optional[bool] = False
    my_rating: Optional[float] = None
    my_reaction: Optional[str] = None

    class Config:
        from_attributes = True


class PaginatedBookResponse(BaseModel):
    total_count: int
    page: int
    page_size: int
    total_pages: int
    books: List[BookOut]


class BookDetailOut(BookOut):
    similar_books: List[BookOut] = []


class QRCodeResponse(BaseModel):
    book_id: int
    title: str
    author_name: str
    isbn: str
    shelf_location: str
    qr_code: str
    qr_payload: str
    qr_image_data: Optional[str] = None  # Base64 data URL
    created_at: datetime


class BorrowerInfo(BaseModel):
    user_id: int
    user_name: str
    user_email: str
    department: Optional[str] = None
    borrow_date: datetime
    due_date: datetime
    return_date: Optional[datetime] = None
    status: str
    fine_amount: float = 0.0


class ScanLookupResponse(BaseModel):
    success: bool
    scan_type: str  # "ISBN", "COPY_BARCODE", "BOOK_ID", "QR_PAYLOAD", "UNKNOWN"
    raw_code: str
    found_locally: bool
    book: Optional[BookOut] = None
    copy_barcode: Optional[str] = None
    copy_status: Optional[str] = None
    shelf_location: Optional[str] = None
    active_borrowers: List[BorrowerInfo] = []
    external_data: Optional[Dict[str, Any]] = None
    message: str


class QRIssueRequest(BaseModel):
    book_id: int
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    student_id_or_email: Optional[str] = None


class QRReturnRequest(BaseModel):
    transaction_id: Optional[int] = None
    book_id: Optional[int] = None
    qr_code: Optional[str] = None


# ==================== Transaction & Loan Schemas ====================

class BorrowRequest(BaseModel):
    book_id: int


class ReturnRequest(BaseModel):
    transaction_id: int


class TransactionOut(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_email: str
    book_id: int
    book_title: str
    book_cover: Optional[str] = None
    borrow_date: datetime
    due_date: datetime
    return_date: Optional[datetime] = None
    status: str
    fine_amount: float
    fine_paid: bool
    remaining_days: Optional[int] = None
    is_overdue: Optional[bool] = False

    class Config:
        from_attributes = True


class BookBorrowersSummary(BaseModel):
    book_id: int
    book_title: str
    total_copies: int
    available_copies: int
    borrowed_copies: int
    current_borrowers: List[BorrowerInfo] = []
    return_history: List[BorrowerInfo] = []


# ==================== Rating & Feedback Schemas ====================

class RatingCreate(BaseModel):
    book_id: int
    rating: float = Field(..., ge=1.0, le=5.0)
    review: Optional[str] = None


class FeedbackCreate(BaseModel):
    book_id: int
    reaction: str = Field(..., pattern="^(LIKE|DISLIKE)$")
    notes: Optional[str] = None


class RecommendationFeedbackCreate(BaseModel):
    book_id: int
    action: str = Field(..., pattern="^(CLICKED|LIKED|DISLIKED|BORROWED)$")


class ColdStartInterests(BaseModel):
    interests: List[str]  # ["Programming", "AI", "Data Science"]


# ==================== AI Recommendation Schemas ====================

class RecommendationItem(BaseModel):
    book: BookOut
    score: float
    reason: str
    model_type: str


class RecommendationResponse(BaseModel):
    user_id: int
    user_name: str
    recommendations: List[RecommendationItem]
    model_version: str = "Hybrid-v1.2-Optimized"


class SearchResponse(BaseModel):
    query: str
    search_type: str  # EXACT or NLP_SEMANTIC
    results_count: int
    books: List[BookOut]


class SearchHistoryOut(BaseModel):
    id: int
    query: str
    search_type: str
    results_count: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== Analytics & Demand Prediction Schemas ====================

class GenreDemandPrediction(BaseModel):
    genre: str
    historical_borrows: int
    predicted_demand_level: str  # HIGH, MEDIUM, LOW
    predicted_next_month_borrows: int
    trend_percentage: float


class BookDemandPrediction(BaseModel):
    book_id: int
    title: str
    genre: str
    current_available: int
    total_copies: int
    historical_borrows: int
    predicted_demand_level: str  # HIGH, MEDIUM, LOW
    recommended_restock_copies: int
    confidence_score: float


class LibraryAnalytics(BaseModel):
    total_books: int
    total_copies: int
    available_copies: int
    borrowed_copies: int
    indian_books_count: int = 0
    tamil_books_count: int = 0
    technical_books_count: int = 0
    total_users: int
    active_borrowers: int
    overdue_count: int
    total_transactions: int
    total_fines_collected: float
    borrows_by_month: List[Dict[str, Any]]
    popular_genres: List[Dict[str, Any]]
    most_borrowed_books: List[Dict[str, Any]]
    return_trends: List[Dict[str, Any]]
    active_users: List[Dict[str, Any]]
    genre_demand_predictions: List[GenreDemandPrediction]
    book_demand_predictions: List[BookDemandPrediction]


# ==================== Model Evaluation Schemas ====================

class MetricComparison(BaseModel):
    model_name: str
    is_baseline: bool
    precision_at_5: float
    recall_at_5: float
    ndcg_at_5: float
    f1_score: float
    coverage: float
    mean_reciprocal_rank: float


class ModelEvaluationResponse(BaseModel):
    comparisons: List[MetricComparison]
    weights: Dict[str, float]
    evaluation_sample_size: int
    last_evaluated_at: datetime
    improvement_summary: str


# ==================== AI Chatbot Schemas ====================

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []


class ChatBookSuggestion(BaseModel):
    id: int
    title: str
    author_name: str
    category_name: str
    cover_image: Optional[str] = None
    available_copies: int
    avg_rating: float = 4.5


class ChatResponse(BaseModel):
    reply: str
    suggested_books: List[ChatBookSuggestion] = []
    quick_replies: List[str] = []


# ==================== Notification Schemas ====================

class NotificationOut(BaseModel):
    id: int
    user_id: int
    book_id: Optional[int] = None
    book_title: Optional[str] = None
    book_cover: Optional[str] = None
    transaction_id: Optional[int] = None
    title: str
    message: str
    notification_type: str
    due_date: Optional[datetime] = None
    days_remaining: Optional[int] = None
    is_overdue: bool = False
    fine_amount: float = 0.0
    is_read: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class UnreadCountOut(BaseModel):
    unread_count: int


class MarkReadResponse(BaseModel):
    success: bool
    message: str


# ==================== Payment & Fine Schemas ====================

class PaymentCreateIntentRequest(BaseModel):
    transaction_id: int
    payment_method: str = "UPI_QR"  # GPAY, PHONEPE, PAYTM, UPI_QR, UPI_ID, CARD, NETBANKING
    upi_vpa: Optional[str] = None


class PaymentIntentResponse(BaseModel):
    reference_id: str
    amount: float
    student_name: str
    book_title: str
    due_date: datetime
    return_date: Optional[datetime] = None
    overdue_days: int
    payment_method: str
    upi_intent_uri: str  # upi://pay?pa=...
    upi_vpa: str
    status: str
    created_at: datetime


class PaymentVerifyRequest(BaseModel):
    reference_id: str
    payment_method: str = "UPI_QR"
    upi_ref_or_utr: Optional[str] = None
    gateway_payment_id: Optional[str] = None


class PaymentReceiptOut(BaseModel):
    receipt_number: str
    reference_id: str
    library_name: str = "AI Central University Library"
    student_name: str
    student_email: str
    student_department: Optional[str] = None
    book_title: str
    book_isbn: str
    due_date: datetime
    return_date: Optional[datetime] = None
    overdue_days: int
    fine_amount: float
    payment_method: str
    status: str
    paid_at: datetime
    verified: bool = True
    notes: str = "Official Digital Receipt - Fine settled successfully."


class PaymentOut(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    book_id: Optional[int] = None
    book_title: Optional[str] = None
    book_cover: Optional[str] = None
    transaction_id: int
    amount: float
    payment_method: str
    reference_id: str
    receipt_number: str
    status: str
    paid_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AdminFineStatsOut(BaseModel):
    total_fines_accrued: float
    total_fines_collected: float
    total_fines_unpaid: float
    pending_payments_count: int
    successful_payments_count: int
    overdue_active_loans_count: int


# --- Authentication & Password Recovery Schemas ---
class ForgotPasswordVerifyRequest(BaseModel):
    email_or_roll: str


class ResetPasswordRequest(BaseModel):
    email_or_roll: str
    new_password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)


class PasswordResetResponse(BaseModel):
    success: bool
    message: str


# --- College Library Location Schemas ---
class LibraryLocationCreate(BaseModel):
    building: str = "Main Library Building"
    floor: str = "1st Floor"
    section: str
    shelf: str
    rack: str
    description: Optional[str] = None
    category_id: Optional[int] = None


class LibraryLocationUpdate(BaseModel):
    building: Optional[str] = None
    floor: Optional[str] = None
    section: Optional[str] = None
    shelf: Optional[str] = None
    rack: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None


class LibraryLocationOut(BaseModel):
    id: int
    building: str
    floor: str
    section: str
    shelf: str
    rack: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True




