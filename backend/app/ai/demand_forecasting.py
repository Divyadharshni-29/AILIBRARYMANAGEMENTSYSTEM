from datetime import datetime, timedelta
from typing import List, Dict, Any
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models.entities import Transaction, Book, Category


class DemandForecaster:
    def __init__(self):
        self.model = Ridge(alpha=1.0)

    def predict_genre_demands(self, db: Session) -> List[Dict[str, Any]]:
        """Predict expected demand per genre/category for the upcoming month."""
        categories = db.query(Category).all()
        transactions = db.query(Transaction).all()

        if not transactions:
            return [
                {
                    "genre": c.name,
                    "historical_borrows": 0,
                    "predicted_demand_level": "MEDIUM",
                    "predicted_next_month_borrows": 5,
                    "trend_percentage": 0.0
                }
                for c in categories
            ]

        # Extract transaction records with timestamps and category
        records = []
        now = datetime.utcnow()
        for t in transactions:
            if t.book and t.book.category:
                records.append({
                    "category": t.book.category.name,
                    "date": t.borrow_date,
                    "days_ago": (now - t.borrow_date).days
                })

        df = pd.DataFrame(records)
        results = []

        for cat in categories:
            cat_name = cat.name
            cat_df = df[df["category"] == cat_name] if not df.empty else pd.DataFrame()

            total_borrows = len(cat_df)
            recent_30d = len(cat_df[cat_df["days_ago"] <= 30]) if not cat_df.empty else 0
            prev_30_60d = len(cat_df[(cat_df["days_ago"] > 30) & (cat_df["days_ago"] <= 60)]) if not cat_df.empty else 0

            # Calculate growth trend
            if prev_30_60d > 0:
                trend_pct = round(((recent_30d - prev_30_60d) / prev_30_60d) * 100, 1)
            else:
                trend_pct = round(recent_30d * 20.0, 1)

            # Expected next month prediction
            predicted_next_month = max(1, int(round(recent_30d * 1.15 + (prev_30_60d * 0.2))))

            # Demand level classification
            if predicted_next_month >= 12 or trend_pct > 25:
                demand_level = "HIGH"
            elif predicted_next_month >= 6 or trend_pct >= 0:
                demand_level = "MEDIUM"
            else:
                demand_level = "LOW"

            results.append({
                "genre": cat_name,
                "historical_borrows": total_borrows,
                "predicted_demand_level": demand_level,
                "predicted_next_month_borrows": predicted_next_month,
                "trend_percentage": trend_pct
            })

        results.sort(key=lambda x: x["predicted_next_month_borrows"], reverse=True)
        return results

    def predict_book_demands(self, db: Session, top_n: int = 15) -> List[Dict[str, Any]]:
        """Predict individual book demand, utilization rate, and recommended restock copies."""
        books = db.query(Book).all()
        now = datetime.utcnow()

        results = []
        for book in books:
            borrows = (
                db.query(Transaction)
                .filter(Transaction.book_id == book.id)
                .all()
            )
            total_borrows = len(borrows)
            recent_borrows = sum(1 for b in borrows if (now - b.borrow_date).days <= 45)

            utilization = (book.total_copies - book.available_copies) / max(1, book.total_copies)

            # Demand forecast heuristic based on recent velocity + stock strain
            velocity_score = (recent_borrows * 1.5) + (utilization * 5.0)

            if velocity_score >= 6.0 or book.available_copies == 0:
                demand_level = "HIGH"
                restock = max(2, int(np.ceil((book.total_copies - book.available_copies) * 0.75)))
                confidence = 0.88
            elif velocity_score >= 3.0:
                demand_level = "MEDIUM"
                restock = 1 if book.available_copies <= 1 else 0
                confidence = 0.82
            else:
                demand_level = "LOW"
                restock = 0
                confidence = 0.78

            results.append({
                "book_id": book.id,
                "title": book.title,
                "genre": book.category.name if book.category else "General",
                "current_available": book.available_copies,
                "total_copies": book.total_copies,
                "historical_borrows": total_borrows,
                "predicted_demand_level": demand_level,
                "recommended_restock_copies": restock,
                "confidence_score": round(confidence, 2)
            })

        results.sort(key=lambda x: (x["predicted_demand_level"] == "HIGH", x["historical_borrows"]), reverse=True)
        return results[:top_n]


demand_forecaster = DemandForecaster()
