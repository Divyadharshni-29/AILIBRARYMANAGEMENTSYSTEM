import re
import numpy as np
from typing import List, Tuple, Dict
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session
from backend.app.models.entities import Book, SearchHistory
from backend.app.ai.content_based import content_recommender


class NLPSearchEngine:
    def __init__(self):
        pass

    def search(
        self,
        query: str,
        db: Session,
        user_id: int = None,
        top_k: int = 20,
        similarity_threshold: float = 0.05
    ) -> Tuple[List[Dict], str]:
        """Perform semantic NLP search using TF-IDF cosine similarity."""
        clean_query = query.strip()
        if not clean_query:
            return [], "EXACT"

        # Ensure content recommender TF-IDF matrix is initialized
        if content_recommender.tfidf_matrix is None:
            content_recommender.fit(db)

        if content_recommender.tfidf_matrix is None or len(content_recommender.book_ids) == 0:
            return [], "EXACT"

        # Check if query is exact title/ISBN/Author match first
        exact_matches = (
            db.query(Book)
            .filter(
                (Book.title.ilike(f"%{clean_query}%")) |
                (Book.isbn == clean_query)
            )
            .all()
        )

        # 1. Transform query into TF-IDF vector
        query_cleaned = re.sub(r"[^\w\s]", " ", clean_query.lower())
        query_vec = content_recommender.vectorizer.transform([query_cleaned])

        # 2. Compute Cosine Similarity against all books
        sim_scores = cosine_similarity(query_vec, content_recommender.tfidf_matrix).flatten()

        results = []
        all_books = {b.id: b for b in db.query(Book).all()}

        # Gather semantic matches
        ranked_indices = np.argsort(sim_scores)[::-1]

        for idx in ranked_indices:
            score = float(sim_scores[idx])
            book_id = content_recommender.idx_to_book_id.get(idx)
            if not book_id or book_id not in all_books:
                continue

            book = all_books[book_id]

            # Boost exact substring matches
            is_exact_match = (
                clean_query.lower() in book.title.lower() or
                (book.category and clean_query.lower() in book.category.name.lower()) or
                (book.author and clean_query.lower() in book.author.name.lower())
            )

            effective_score = score
            if is_exact_match:
                effective_score = max(effective_score, 0.85)

            if effective_score >= similarity_threshold:
                results.append({
                    "book": book,
                    "relevance_score": round(float(effective_score), 4),
                    "is_semantic_match": not is_exact_match and score > 0.05
                })

            if len(results) >= top_k:
                break

        # Save to search history for behaviour analysis
        search_type = "NLP_SEMANTIC" if len(clean_query.split()) > 2 else "EXACT"
        history_entry = SearchHistory(
            user_id=user_id,
            query=clean_query,
            search_type=search_type,
            results_count=len(results)
        )
        db.add(history_entry)
        db.commit()

        return results, search_type


nlp_search_engine = NLPSearchEngine()
