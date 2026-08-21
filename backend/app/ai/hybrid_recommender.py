import json
from typing import List, Dict, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.core.config import settings
from backend.app.models.entities import (
    Book, Transaction, Rating, Feedback, User, Recommendation, RecommendationFeedback, UserPreference
)
from backend.app.ai.content_based import content_recommender
from backend.app.ai.collaborative import collaborative_recommender
from backend.app.ai.user_profiler import user_profiler


class HybridRecommender:
    def __init__(self):
        self.w_content = settings.CONTENT_WEIGHT
        self.w_collab = settings.COLLAB_WEIGHT
        self.w_behaviour = settings.BEHAVIOUR_WEIGHT
        self.w_popularity = settings.POPULARITY_WEIGHT

    def train_models(self, db: Session):
        """Fit both content-based and collaborative models on current DB state."""
        content_recommender.fit(db)
        collaborative_recommender.fit(db)

    def _get_popularity_scores(self, all_books: List[Book], db: Session) -> Dict[int, float]:
        """Compute normalized popularity score for all books from borrow counts and average ratings."""
        borrow_counts = dict(
            db.query(Transaction.book_id, func.count(Transaction.id))
            .group_by(Transaction.book_id)
            .all()
        )
        rating_data = dict(
            db.query(Rating.book_id, func.avg(Rating.rating))
            .group_by(Rating.book_id)
            .all()
        )

        scores = {}
        max_borrows = max(borrow_counts.values()) if borrow_counts else 1

        for book in all_books:
            b_count = borrow_counts.get(book.id, 0)
            b_norm = b_count / max_borrows if max_borrows > 0 else 0.0
            r_avg = float(rating_data.get(book.id, 3.0)) / 5.0
            pop_score = 0.6 * b_norm + 0.4 * r_avg
            scores[book.id] = pop_score

        return scores

    def recommend(
        self,
        user_id: int,
        db: Session,
        top_k: int = 5,
        w_content: Optional[float] = None,
        w_collab: Optional[float] = None,
        w_behaviour: Optional[float] = None,
        w_popularity: Optional[float] = None,
    ) -> List[Dict]:
        """Generate personalized hybrid recommendations for a user with explainable reasons."""
        # Configurable weights
        wc = w_content if w_content is not None else self.w_content
        wcf = w_collab if w_collab is not None else self.w_collab
        wb = w_behaviour if w_behaviour is not None else self.w_behaviour
        wp = w_popularity if w_popularity is not None else self.w_popularity

        # Normalize weights
        total_w = wc + wcf + wb + wp
        if total_w > 0:
            wc, wcf, wb, wp = wc / total_w, wcf / total_w, wb / total_w, wp / total_w

        # Ensure models are fitted
        if content_recommender.tfidf_matrix is None:
            self.train_models(db)

        all_books = db.query(Book).all()
        if not all_books:
            return []

        all_book_ids = [b.id for b in all_books]
        book_map = {b.id: b for b in all_books}

        # 1. Fetch user interaction state
        active_borrowed_ids = set(
            db.query(Transaction.book_id)
            .filter(Transaction.user_id == user_id, Transaction.status.in_(["BORROWED", "OVERDUE"]))
            .all()
        )
        active_borrowed_ids = {b[0] for b in active_borrowed_ids}

        disliked_ids = set(
            db.query(Feedback.book_id)
            .filter(Feedback.user_id == user_id, Feedback.reaction == "DISLIKE")
            .all()
        )
        disliked_ids = {b[0] for b in disliked_ids}

        liked_book_ids = set(
            db.query(Feedback.book_id)
            .filter(Feedback.user_id == user_id, Feedback.reaction == "LIKE")
            .all()
        )
        liked_book_ids.update([
            r[0] for r in db.query(Rating.book_id).filter(Rating.user_id == user_id, Rating.rating >= 4.0).all()
        ])
        liked_book_ids.update([
            t[0] for t in db.query(Transaction.book_id).filter(Transaction.user_id == user_id).all()
        ])
        liked_book_ids = list(liked_book_ids)

        # 2. Component 1: Content-Based Scores
        content_results = content_recommender.get_user_content_scores(liked_book_ids, all_book_ids)

        # 3. Component 2: Collaborative Scores
        collab_results = collaborative_recommender.get_user_collab_scores(user_id, all_book_ids)

        # 4. Component 3: User Behaviour & Affinity Scores
        affinity_vector = user_profiler.get_user_affinity_vector(user_id, db)

        # 5. Component 4: Popularity Scores
        popularity_scores = self._get_popularity_scores(all_books, db)

        # Combine scores
        final_scores = []
        for book in all_books:
            bid = book.id
            if bid in active_borrowed_ids or bid in disliked_ids:
                continue

            c_score, c_reason = content_results.get(bid, (0.0, ""))
            cf_score, cf_reason = collab_results.get(bid, (0.0, ""))
            genre_name = book.category.name if book.category else ""
            b_score = affinity_vector.get(genre_name, 0.1)
            p_score = popularity_scores.get(bid, 0.5)

            hybrid_score = (wc * c_score) + (wcf * cf_score) + (wb * b_score) + (wp * p_score)

            # Determine predominant reason for Explainable AI
            component_contributions = [
                (wc * c_score, f"Similar to books you previously read & liked"),
                (wcf * cf_score, f"Popular among readers with reading tastes similar to yours"),
                (wb * b_score, f"Matches your high interest in {genre_name}"),
                (wp * p_score, f"Highly rated across the library community")
            ]
            component_contributions.sort(key=lambda x: x[0], reverse=True)
            best_reason = component_contributions[0][1]

            # Model type badge
            if not liked_book_ids and affinity_vector:
                model_type = "COLD_START"
                best_reason = f"Curated for your selected interests in {genre_name}"
            elif component_contributions[0][0] == wc * c_score:
                model_type = "CONTENT_BASED"
            elif component_contributions[0][0] == wcf * cf_score:
                model_type = "COLLABORATIVE"
            else:
                model_type = "HYBRID"

            final_scores.append({
                "book_id": bid,
                "book": book,
                "score": round(float(hybrid_score), 4),
                "reason": best_reason,
                "model_type": model_type
            })

        final_scores.sort(key=lambda x: x["score"], reverse=True)
        top_recommendations = final_scores[:top_k]

        # Log recommendations in DB
        for item in top_recommendations:
            rec_entry = Recommendation(
                user_id=user_id,
                book_id=item["book_id"],
                model_type=item["model_type"],
                score=item["score"],
                reason=item["reason"]
            )
            db.add(rec_entry)
        db.commit()

        return top_recommendations


hybrid_recommender = HybridRecommender()
