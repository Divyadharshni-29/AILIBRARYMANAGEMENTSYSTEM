import re
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session
from backend.app.models.entities import Book, Category, Author


class ContentBasedRecommender:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            max_features=5000,
            sublinear_tf=True
        )
        self.tfidf_matrix = None
        self.book_ids = []
        self.book_id_to_idx = {}
        self.idx_to_book_id = {}
        self.feature_names = []

    def _prepare_corpus(self, books: List[Book]) -> List[str]:
        corpus = []
        self.book_ids = []
        self.book_id_to_idx = {}
        self.idx_to_book_id = {}

        for idx, book in enumerate(books):
            self.book_ids.append(book.id)
            self.book_id_to_idx[book.id] = idx
            self.idx_to_book_id[idx] = book.id

            author_name = book.author.name if book.author else ""
            category_name = book.category.name if book.category else ""
            description = book.description or ""
            keywords = book.keywords or ""
            title = book.title or ""

            # Repeat title and category to give higher weight in TF-IDF
            combined_text = f"{title} {title} {category_name} {category_name} {author_name} {keywords} {keywords} {description}"
            clean_text = re.sub(r"[^\w\s]", " ", combined_text.lower())
            corpus.append(clean_text)

        return corpus

    def fit(self, db: Session):
        """Fit the TF-IDF vectorizer on all books in the database."""
        books = db.query(Book).all()
        if not books:
            return

        corpus = self._prepare_corpus(books)
        self.tfidf_matrix = self.vectorizer.fit_transform(corpus)
        self.feature_names = self.vectorizer.get_feature_names_out()

    def get_similar_books(self, book_id: int, top_n: int = 5) -> List[Tuple[int, float, str]]:
        """Return top N similar books to a specific book with similarity score and explanation."""
        if self.tfidf_matrix is None or book_id not in self.book_id_to_idx:
            return []

        target_idx = self.book_id_to_idx[book_id]
        target_vec = self.tfidf_matrix[target_idx]

        sim_scores = cosine_similarity(target_vec, self.tfidf_matrix).flatten()
        sim_scores[target_idx] = -1.0  # exclude self

        top_indices = np.argsort(sim_scores)[::-1][:top_n]
        results = []

        # Find top shared TF-IDF keywords for explanation
        target_dense = target_vec.toarray().flatten()

        for idx in top_indices:
            other_book_id = self.idx_to_book_id[idx]
            score = float(sim_scores[idx])
            if score <= 0.0:
                continue

            other_dense = self.tfidf_matrix[idx].toarray().flatten()
            shared_weights = target_dense * other_dense
            top_shared_kw_indices = np.argsort(shared_weights)[::-1][:3]
            shared_keywords = [
                self.feature_names[k] for k in top_shared_kw_indices
                if shared_weights[k] > 0 and len(self.feature_names[k]) > 2
            ]

            if shared_keywords:
                reason = f"Shares topics: {', '.join(shared_keywords[:2])}"
            else:
                reason = "Similar content and genre profile"

            results.append((other_book_id, score, reason))

        return results

    def get_user_content_scores(self, user_liked_book_ids: List[int], all_book_ids: List[int]) -> Dict[int, Tuple[float, str]]:
        """Calculate content similarity scores across all books based on a user's liked/borrowed books."""
        scores = {bid: (0.0, "General Library Selection") for bid in all_book_ids}
        if not user_liked_book_ids or self.tfidf_matrix is None:
            return scores

        valid_liked_indices = [
            self.book_id_to_idx[bid] for bid in user_liked_book_ids
            if bid in self.book_id_to_idx
        ]
        if not valid_liked_indices:
            return scores

        # User profile vector = average of liked book vectors
        user_vector = np.asarray(self.tfidf_matrix[valid_liked_indices].mean(axis=0))
        sim_scores = cosine_similarity(user_vector, self.tfidf_matrix).flatten()

        for idx, score in enumerate(sim_scores):
            bid = self.idx_to_book_id.get(idx)
            if bid:
                norm_score = float(score)
                reason = "Matches your reading history & topics"
                scores[bid] = (norm_score, reason)

        return scores


content_recommender = ContentBasedRecommender()
