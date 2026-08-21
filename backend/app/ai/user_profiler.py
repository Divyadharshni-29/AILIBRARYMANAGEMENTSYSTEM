import json
from typing import Dict, List
from sqlalchemy.orm import Session
from backend.app.models.entities import (
    User, Transaction, Rating, Feedback, BookView, SearchHistory, UserPreference, Book, Category
)


class UserProfiler:
    def __init__(self):
        pass

    def compute_user_profile(self, user_id: int, db: Session) -> Dict[str, float]:
        """Compute normalized category affinity scores for a user based on interactions."""
        # 1. Check existing preference record
        pref = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
        initial_interests = []
        if pref and pref.initial_interests_json:
            try:
                initial_interests = json.loads(pref.initial_interests_json)
            except Exception:
                initial_interests = []

        all_categories = db.query(Category).all()
        cat_names = [c.name for c in all_categories]
        scores = {c: 0.1 for c in cat_names}  # small baseline prior

        # Seed with initial onboarding interests if any
        for interest in initial_interests:
            for cat in cat_names:
                if interest.lower() in cat.lower() or cat.lower() in interest.lower():
                    scores[cat] += 2.0

        # Factor in Borrowing Transactions (+3.0 per borrow)
        transactions = db.query(Transaction).filter(Transaction.user_id == user_id).all()
        for t in transactions:
            if t.book and t.book.category:
                cat_name = t.book.category.name
                scores[cat_name] = scores.get(cat_name, 0.1) + 3.0

        # Factor in Ratings
        ratings = db.query(Rating).filter(Rating.user_id == user_id).all()
        for r in ratings:
            if r.book and r.book.category:
                cat_name = r.book.category.name
                # (Rating - 2.5) * 1.5
                rating_delta = (r.rating - 2.5) * 1.5
                scores[cat_name] = max(0.0, scores.get(cat_name, 0.1) + rating_delta)

        # Factor in Likes/Dislikes
        feedbacks = db.query(Feedback).filter(Feedback.user_id == user_id).all()
        for f in feedbacks:
            if f.book and f.book.category:
                cat_name = f.book.category.name
                if f.reaction == "LIKE":
                    scores[cat_name] = scores.get(cat_name, 0.1) + 2.0
                elif f.reaction == "DISLIKE":
                    scores[cat_name] = max(0.0, scores.get(cat_name, 0.1) - 2.0)

        # Factor in Book Views
        views = db.query(BookView).filter(BookView.user_id == user_id).all()
        for v in views:
            if v.book and v.book.category:
                cat_name = v.book.category.name
                scores[cat_name] = scores.get(cat_name, 0.1) + 0.5

        # Factor in Search History
        searches = db.query(SearchHistory).filter(SearchHistory.user_id == user_id).all()
        for s in searches:
            query_lower = s.query.lower()
            for cat in cat_names:
                if cat.lower() in query_lower:
                    scores[cat] = scores.get(cat, 0.1) + 1.0

        # Normalize to [0.0, 1.0] range
        max_score = max(scores.values()) if scores else 1.0
        if max_score > 0:
            normalized_scores = {k: round(v / max_score, 3) for k, v in scores.items()}
        else:
            normalized_scores = {k: 0.1 for k in scores}

        # Save to UserPreference table
        if not pref:
            pref = UserPreference(
                user_id=user_id,
                genre_scores_json=json.dumps(normalized_scores),
                initial_interests_json=json.dumps(initial_interests)
            )
            db.add(pref)
        else:
            pref.genre_scores_json = json.dumps(normalized_scores)
        db.commit()

        return normalized_scores

    def get_user_affinity_vector(self, user_id: int, db: Session) -> Dict[str, float]:
        pref = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
        if pref and pref.genre_scores_json:
            try:
                return json.loads(pref.genre_scores_json)
            except Exception:
                pass
        return self.compute_user_profile(user_id, db)


user_profiler = UserProfiler()
