from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.entities import Book, User, SearchHistory
from backend.app.schemas.schemas import SearchResponse, BookOut, SearchHistoryOut
from backend.app.routers.deps import get_optional_current_user, get_current_user
from backend.app.routers.books import _format_book_out
from backend.app.ai.nlp_search import nlp_search_engine

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("", response_model=SearchResponse)
def search_books(
    q: str = Query(..., min_length=1),
    search_type: Optional[str] = Query("auto", description="auto, nlp, exact"),
    category_id: Optional[int] = None,
    available_only: Optional[bool] = False,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Perform intelligent NLP semantic search or exact keyword search."""
    user_id = current_user.id if current_user else None

    # Perform NLP search
    nlp_results, detected_type = nlp_search_engine.search(
        query=q,
        db=db,
        user_id=user_id,
        top_k=60,
        similarity_threshold=0.04
    )

    formatted_books = []
    for item in nlp_results:
        book: Book = item["book"]

        # Apply category filter
        if category_id and book.category_id != category_id:
            continue

        # Apply availability filter
        if available_only and book.available_copies <= 0:
            continue

        book_out = _format_book_out(book, db, current_user)
        formatted_books.append(book_out)

    effective_type = "NLP_SEMANTIC" if (search_type == "nlp" or (search_type == "auto" and detected_type == "NLP_SEMANTIC")) else "EXACT"

    return SearchResponse(
        query=q,
        search_type=effective_type,
        results_count=len(formatted_books),
        books=formatted_books
    )


@router.get("/history", response_model=List[SearchHistoryOut])
def get_user_search_history(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve the current user's past search queries and AI NLP history."""
    history = (
        db.query(SearchHistory)
        .filter(SearchHistory.user_id == current_user.id)
        .order_by(SearchHistory.created_at.desc())
        .limit(limit)
        .all()
    )
    return history


@router.delete("/history", status_code=status.HTTP_200_OK)
def clear_user_search_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Clear the current user's search history."""
    db.query(SearchHistory).filter(SearchHistory.user_id == current_user.id).delete()
    db.commit()
    return {"message": "Search history cleared successfully."}

