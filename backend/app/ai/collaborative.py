import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
from scipy.sparse import csr_matrix
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD
from sqlalchemy.orm import Session
from backend.app.models.entities import Transaction, Rating, Feedback, Book, User


class CollaborativeRecommender:
    def __init__(self, n_factors: int = 8):
        self.n_factors = n_factors
        self.user_item_matrix = None
        self.user_ids = []
        self.book_ids = []
        self.user_to_idx = {}
        self.idx_to_user = {}
        self.book_to_idx = {}
        self.idx_to_book = {}
        self.predicted_matrix = None
        self.user_similarity = None

    def fit(self, db: Session):
        """Build User-Item interaction matrix from transactions, ratings, and feedback."""
        # 1. Fetch interactions
        transactions = db.query(Transaction).all()
        ratings = db.query(Rating).all()
        feedbacks = db.query(Feedback).all()
        all_books = db.query(Book.id).all()
        all_users = db.query(User.id).all()

        if not all_books or not all_users:
            return

        self.book_ids = [b[0] for b in all_books]
        self.user_ids = [u[0] for u in all_users]

        self.user_to_idx = {uid: idx for idx, uid in enumerate(self.user_ids)}
        self.idx_to_user = {idx: uid for idx, uid in enumerate(self.user_ids)}
        self.book_to_idx = {bid: idx for idx, bid in enumerate(self.book_ids)}
        self.idx_to_book = {idx: bid for idx, bid in enumerate(self.book_ids)}

        num_users = len(self.user_ids)
        num_books = len(self.book_ids)
        matrix = np.zeros((num_users, num_books), dtype=np.float32)

        # Weight transactions (Borrowing = +3.0)
        for t in transactions:
            if t.user_id in self.user_to_idx and t.book_id in self.book_to_idx:
                u_idx = self.user_to_idx[t.user_id]
                b_idx = self.book_to_idx[t.book_id]
                matrix[u_idx, b_idx] += 3.0

        # Weight explicit ratings (1-5 normalized to 1.0 - 5.0)
        for r in ratings:
            if r.user_id in self.user_to_idx and r.book_id in self.book_to_idx:
                u_idx = self.user_to_idx[r.user_id]
                b_idx = self.book_to_idx[r.book_id]
                # Replace or add rating weight
                matrix[u_idx, b_idx] = max(matrix[u_idx, b_idx], float(r.rating))

        # Weight feedback (+2.0 for like, -2.0 for dislike)
        for f in feedbacks:
            if f.user_id in self.user_to_idx and f.book_id in self.book_to_idx:
                u_idx = self.user_to_idx[f.user_id]
                b_idx = self.book_to_idx[f.book_id]
                if f.reaction == "LIKE":
                    matrix[u_idx, b_idx] += 2.0
                elif f.reaction == "DISLIKE":
                    matrix[u_idx, b_idx] = max(0.0, matrix[u_idx, b_idx] - 2.0)

        self.user_item_matrix = matrix

        # Compute User-User Cosine Similarity
        if np.count_nonzero(matrix) > 0:
            self.user_similarity = cosine_similarity(matrix)

            # Apply Matrix Factorization / Truncated SVD for latent dimensionality
            n_components = min(self.n_factors, num_users - 1, num_books - 1)
            if n_components >= 2:
                svd = TruncatedSVD(n_components=n_components, random_state=42)
                user_factors = svd.fit_transform(matrix)
                item_factors = svd.components_
                self.predicted_matrix = np.dot(user_factors, item_factors)
            else:
                self.predicted_matrix = matrix.copy()
        else:
            self.user_similarity = np.eye(num_users)
            self.predicted_matrix = matrix.copy()

    def get_user_collab_scores(self, user_id: int, all_book_ids: List[int]) -> Dict[int, Tuple[float, str]]:
        """Calculate collaborative filtering score for every book for a given user."""
        scores = {bid: (0.0, "Collaborative recommendation") for bid in all_book_ids}

        if self.user_item_matrix is None or user_id not in self.user_to_idx:
            return scores

        u_idx = self.user_to_idx[user_id]

        # 1. SVD prediction scores
        raw_scores = self.predicted_matrix[u_idx].copy()
        max_score = np.max(raw_scores) if np.max(raw_scores) > 0 else 1.0
        normalized_scores = raw_scores / max_score

        # 2. Find most similar user to create explainable reason
        sim_vector = self.user_similarity[u_idx].copy()
        sim_vector[u_idx] = -1.0
        top_sim_user_idx = np.argmax(sim_vector)
        sim_val = sim_vector[top_sim_user_idx]

        for b_idx, norm_score in enumerate(normalized_scores):
            bid = self.idx_to_book.get(b_idx)
            if bid:
                if sim_val > 0.3:
                    reason = "Readers with similar reading habits enjoyed this book"
                else:
                    reason = "Popular among members with matching interests"
                scores[bid] = (float(np.clip(norm_score, 0.0, 1.0)), reason)

        return scores


collaborative_recommender = CollaborativeRecommender()
