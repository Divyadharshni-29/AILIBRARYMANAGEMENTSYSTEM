from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.entities import (
    Rating, Feedback, RecommendationFeedback, Book, User
)
from backend.app.schemas.schemas import (
    RatingCreate, FeedbackCreate, RecommendationFeedbackCreate
)
from backend.app.routers.deps import get_current_user
from backend.app.ai.user_profiler import user_profiler

router = APIRouter(prefix="/interactions", tags=["Ratings & Feedback"])


@router.post("/rate")
def rate_book(
    payload: RatingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    book = db.query(Book).filter(Book.id == payload.book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found.")

    rating_entry = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.book_id == payload.book_id
    ).first()

    if not rating_entry:
        rating_entry = Rating(
            user_id=current_user.id,
            book_id=payload.book_id,
            rating=payload.rating,
            review=payload.review
        )
        db.add(rating_entry)
    else:
        rating_entry.rating = payload.rating
        rating_entry.review = payload.review

    db.commit()

    # Trigger AI user profile update
    user_profiler.compute_user_profile(current_user.id, db)

    return {"message": "Rating submitted successfully.", "rating": payload.rating}


@router.post("/feedback")
def submit_feedback(
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    book = db.query(Book).filter(Book.id == payload.book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found.")

    feedback_entry = db.query(Feedback).filter(
        Feedback.user_id == current_user.id,
        Feedback.book_id == payload.book_id
    ).first()

    if not feedback_entry:
        feedback_entry = Feedback(
            user_id=current_user.id,
            book_id=payload.book_id,
            reaction=payload.reaction,
            notes=payload.notes
        )
        db.add(feedback_entry)
    else:
        feedback_entry.reaction = payload.reaction
        feedback_entry.notes = payload.notes

    db.commit()

    # Trigger AI user profile update
    user_profiler.compute_user_profile(current_user.id, db)

    return {"message": f"Reaction '{payload.reaction}' recorded.", "reaction": payload.reaction}


@router.post("/recommendation-feedback")
def submit_rec_feedback(
    payload: RecommendationFeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entry = RecommendationFeedback(
        user_id=current_user.id,
        book_id=payload.book_id,
        action=payload.action
    )
    db.add(entry)
    db.commit()

    # If action was LIKED or DISLIKED, also register in feedback
    if payload.action in ["LIKED", "DISLIKED"]:
        reaction = "LIKE" if payload.action == "LIKED" else "DISLIKE"
        feedback_entry = db.query(Feedback).filter(
            Feedback.user_id == current_user.id,
            Feedback.book_id == payload.book_id
        ).first()
        if not feedback_entry:
            feedback_entry = Feedback(
                user_id=current_user.id,
                book_id=payload.book_id,
                reaction=reaction
            )
            db.add(feedback_entry)
        else:
            feedback_entry.reaction = reaction
        db.commit()
        user_profiler.compute_user_profile(current_user.id, db)

    return {"message": f"Feedback action '{payload.action}' recorded for AI model learning."}
