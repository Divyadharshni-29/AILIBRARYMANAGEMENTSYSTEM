import json
import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.entities import (
    User, Book, UserPreference, ModelEvaluation, Rating
)
from backend.app.schemas.schemas import (
    RecommendationResponse, RecommendationItem, ModelEvaluationResponse,
    GenreDemandPrediction, BookDemandPrediction,
    ChatRequest, ChatResponse, ChatBookSuggestion
)
from backend.app.routers.deps import get_current_user, require_role, get_optional_current_user
from backend.app.routers.books import _format_book_out
from backend.app.ai.hybrid_recommender import hybrid_recommender
from backend.app.ai.user_profiler import user_profiler
from backend.app.ai.demand_forecasting import demand_forecaster
from backend.app.ai.evaluation import model_evaluator
from backend.app.ai.nlp_search import nlp_search_engine

router = APIRouter(prefix="/ai", tags=["AI & Machine Learning"])


@router.post("/chat", response_model=ChatResponse)
def chat_with_ai_assistant(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Interactive AI Library Assistant for book search, loan guidelines, and recommendations."""
    raw_msg = (req.message or "").strip().lower()
    user_name = current_user.name if current_user else "Reader"
    user_id = current_user.id if current_user else None

    # 1. Greetings
    if re.search(r"^(hi|hello|hey|greetings|good morning|good afternoon|good evening|yo)\b", raw_msg):
        return ChatResponse(
            reply=f"Hello {user_name}! 👋 I am your **AI Library Assistant**. I can help you find books, give personalized recommendations, explain library policies (timings, fines, dues), or explore topics. What are you looking to read today?",
            suggested_books=[],
            quick_replies=[
                "Suggest AI & ML books",
                "What are the library rules & timings?",
                "How does the AI recommendation work?",
                "Show books on Algorithms"
            ]
        )

    # 2. Library Rules & Borrowing Policies
    if any(k in raw_msg for k in ["rule", "timing", "time", "hour", "fine", "due", "policy", "how to borrow", "limit", "cost"]):
        return ChatResponse(
            reply=(
                "📖 **Library Guidelines & Circulation Rules:**\n\n"
                "• **Operating Hours:** Monday – Saturday: 8:00 AM – 8:00 PM\n"
                "• **Borrowing Limit:** Students can borrow up to **3 books** concurrently.\n"
                "• **Loan Duration:** Standard loan period is **14 days**.\n"
                "• **Overdue Fine:** ₹2.00 per day after the due date.\n"
                "• **Online Requests:** You can request to borrow any available book instantly with 1-click in the Book Catalog!"
            ),
            suggested_books=[],
            quick_replies=[
                "Find books for my major",
                "Recommend top rated books",
                "How do fines work?"
            ]
        )

    # 3. How AI Works explanation
    if any(k in raw_msg for k in ["how does ai work", "how do you recommend", "algorithm", "model", "explain ai"]):
        return ChatResponse(
            reply=(
                "🤖 **How My AI Engine Works:**\n\n"
                "1. **NLP Semantic Matching:** When you search, I convert your queries into TF-IDF vector embeddings to understand concepts beyond literal keywords.\n"
                "2. **Collaborative Filtering (SVD):** I discover reading patterns among students to recommend books enjoyed by readers with similar interests.\n"
                "3. **Dynamic User Profiling:** Every search, borrow, and rating you submit continuously tunes your personalized **Genre Affinity Vector**!"
            ),
            suggested_books=[],
            quick_replies=[
                "Recommend books based on my taste",
                "Search Python books",
                "View my profile"
            ]
        )

    # 4. Search & Book Recommendations using NLP
    # Clean query for search
    search_query = req.message
    for filler in ["recommend me", "recommend", "suggest me", "suggest", "find me", "find", "search for", "search", "books on", "books about", "book on", "book about"]:
        search_query = re.sub(rf"(?i)\b{re.escape(filler)}\b", "", search_query).strip()

    if not search_query:
        search_query = req.message

    nlp_results, detected_type = nlp_search_engine.search(
        query=search_query,
        db=db,
        user_id=user_id,
        top_k=4,
        similarity_threshold=0.03
    )

    suggested_books = []
    for item in nlp_results:
        b: Book = item["book"]
        # Calculate rating
        ratings = db.query(Rating.rating).filter(Rating.book_id == b.id).all()
        avg_rat = round(sum(r[0] for r in ratings) / len(ratings), 1) if ratings else 4.5
        suggested_books.append(ChatBookSuggestion(
            id=b.id,
            title=b.title,
            author_name=b.author.name if b.author else "Various Authors",
            category_name=b.category.name if b.category else "General",
            cover_image=b.cover_image,
            available_copies=b.available_copies,
            avg_rating=avg_rat
        ))

    if suggested_books:
        reply_intro = (
            f"Here are the top book matches I found for **\"{req.message}\"** using "
            f"{'AI Semantic NLP matching' if detected_type == 'NLP_SEMANTIC' else 'keyword discovery'}:"
        )
        return ChatResponse(
            reply=reply_intro,
            suggested_books=suggested_books,
            quick_replies=[
                f"More in {suggested_books[0].category_name}",
                "Recommend other topics",
                "What are the loan limits?"
            ]
        )

    # Fallback response
    return ChatResponse(
        reply=f"I couldn't find exact matches for \"{req.message}\", but you can try searching by topic (e.g., *Data Science*, *Algorithms*, *Cloud Computing*, *Psychology*) or ask about library services!",
        suggested_books=[],
        quick_replies=[
            "Show Computer Science books",
            "Show Artificial Intelligence books",
            "What are library timings?"
        ]
    )



@router.get("/recommendations", response_model=RecommendationResponse)
def get_personalized_recommendations(
    top_k: int = Query(6, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch AI-generated personalized hybrid recommendations with transparent explainability."""
    raw_recs = hybrid_recommender.recommend(current_user.id, db, top_k=top_k)

    items = []
    for r in raw_recs:
        book_out = _format_book_out(r["book"], db, current_user)
        items.append(RecommendationItem(
            book=book_out,
            score=r["score"],
            reason=r["reason"],
            model_type=r["model_type"]
        ))

    return RecommendationResponse(
        user_id=current_user.id,
        user_name=current_user.name,
        recommendations=items,
        model_version="Hybrid-SVD-TFIDF-v1.4"
    )


@router.get("/user-profile")
def get_user_ai_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve the student's normalized category affinity vector and onboarding interests."""
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        affinities = user_profiler.compute_user_profile(current_user.id, db)
        interests = []
    else:
        try:
            affinities = json.loads(pref.genre_scores_json or "{}")
        except Exception:
            affinities = {}
        try:
            interests = json.loads(pref.initial_interests_json or "[]")
        except Exception:
            interests = []

    return {
        "user_id": current_user.id,
        "name": current_user.name,
        "department": current_user.department,
        "interests": interests,
        "genre_affinities": affinities,
        "last_updated": pref.last_updated if pref else None
    }


@router.get("/demand-predictions")
def get_demand_predictions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["librarian", "admin"]))
):
    """Librarian AI demand forecasting for genres and books."""
    genre_demands = demand_forecaster.predict_genre_demands(db)
    book_demands = demand_forecaster.predict_book_demands(db, top_n=20)

    return {
        "genre_demand_predictions": genre_demands,
        "book_demand_predictions": book_demands,
        "forecast_period": "Upcoming 30 Days",
        "methodology": "Ridge Regression + Borrow Velocity + Stock Strain Analysis"
    }


@router.get("/evaluations", response_model=ModelEvaluationResponse)
def get_model_evaluations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "librarian"]))
):
    """Compute and return genuine offline recommendation evaluation metrics comparing baseline vs improved models."""
    eval_data = model_evaluator.evaluate_all_models(db, k=5)
    return ModelEvaluationResponse(**eval_data)


@router.post("/retrain")
def retrain_ai_models(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "librarian"]))
):
    """Trigger refitting of TF-IDF vectors, SVD collaborative matrix, and user preference profiles."""
    hybrid_recommender.train_models(db)
    eval_result = model_evaluator.evaluate_all_models(db, k=5)
    return {
        "message": "AI models retrained and refitted successfully.",
        "eval_summary": eval_result.get("improvement_summary", "")
    }
