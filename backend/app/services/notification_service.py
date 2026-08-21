from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.core.config import settings
from backend.app.models.entities import Transaction, Book, User, Notification, Fine
from backend.app.schemas.schemas import NotificationOut


class NotificationService:
    @staticmethod
    def generate_due_date_notifications(db: Session, target_user_id: Optional[int] = None) -> int:
        """
        Scans all active transactions (status BORROWED or OVERDUE, return_date is None),
        calculates remaining days to due_date, and generates deduplicated reminders:
        - 3 days before: REMINDER_3_DAYS
        - 2 days before: REMINDER_2_DAYS
        - 1 day before:  REMINDER_1_DAY (Due Tomorrow)
        - On due date:   DUE_TODAY
        - Past due date: OVERDUE (with calculated fine & overdue days)
        """
        now = datetime.utcnow()
        today = now.date()

        query = db.query(Transaction).filter(
            Transaction.status.in_(["BORROWED", "OVERDUE"]),
            Transaction.return_date.is_(None)
        )
        if target_user_id:
            query = query.filter(Transaction.user_id == target_user_id)

        active_txs = query.all()
        created_count = 0

        for tx in active_txs:
            book = tx.book or db.query(Book).filter(Book.id == tx.book_id).first()
            book_title = book.title if book else "Library Book"
            due_date = tx.due_date
            if not due_date:
                continue

            due_day = due_date.date()
            delta_days = (due_day - today).days

            ntype = None
            title = ""
            msg = ""

            if delta_days == 3:
                ntype = "REMINDER_3_DAYS"
                title = "📚 Book Due in 3 Days"
                msg = f"📚 Return Reminder: Your book '{book_title}' is due in 3 days ({due_date.strftime('%b %d, %Y')}). Please return it on time."
            elif delta_days == 2:
                ntype = "REMINDER_2_DAYS"
                title = "⏰ Book Due in 2 Days"
                msg = f"⏰ Reminder: Your book '{book_title}' is due in 2 days. Please plan to return it."
            elif delta_days == 1:
                ntype = "REMINDER_1_DAY"
                title = "⚠️ Book Due Tomorrow"
                msg = f"⚠️ Your book '{book_title}' is due tomorrow ({due_date.strftime('%b %d, %Y')}). Please return it to the library."
            elif delta_days == 0:
                ntype = "DUE_TODAY"
                title = "🔔 Book Due Today"
                msg = f"🔔 Your book '{book_title}' is due today ({due_date.strftime('%b %d, %Y')}). Please return it today."
            elif delta_days < 0:
                overdue_days = abs(delta_days)
                fine = round(overdue_days * settings.DAILY_FINE_RATE, 2)
                
                # Mark transaction status and fine amount
                if tx.status == "BORROWED":
                    tx.status = "OVERDUE"
                tx.fine_amount = fine

                ntype = "OVERDUE"
                title = "🚨 Overdue Book Alert"
                day_word = "day" if overdue_days == 1 else "days"
                msg = f"🚨 Overdue: Your book '{book_title}' is overdue by {overdue_days} {day_word}. Please return it as soon as possible. A fine of ₹{fine:.2f} may apply."
            else:
                # delta_days > 3: not yet in reminder window
                continue

            # Deduplication logic
            if ntype == "OVERDUE":
                # For overdue, check if an existing overdue notification exists for this transaction
                existing_overdue = db.query(Notification).filter(
                    Notification.user_id == tx.user_id,
                    Notification.transaction_id == tx.id,
                    Notification.notification_type == "OVERDUE"
                ).first()

                if existing_overdue:
                    # Update message and due date with current fine and overdue days
                    existing_overdue.message = msg
                    existing_overdue.title = title
                    existing_overdue.due_date = due_date
                    # If older than 1 day, mark unread to alert the student of growing fine
                    if (now - existing_overdue.created_at).days >= 1:
                        existing_overdue.is_read = False
                        existing_overdue.created_at = now
                else:
                    new_notif = Notification(
                        user_id=tx.user_id,
                        book_id=tx.book_id,
                        transaction_id=tx.id,
                        title=title,
                        message=msg,
                        notification_type=ntype,
                        due_date=due_date,
                        is_read=False,
                        created_at=now
                    )
                    db.add(new_notif)
                    created_count += 1
            else:
                # For 3-day, 2-day, 1-day, and due-today: check if already notified for this loan
                existing_reminder = db.query(Notification).filter(
                    Notification.user_id == tx.user_id,
                    Notification.transaction_id == tx.id,
                    Notification.notification_type == ntype
                ).first()

                if not existing_reminder:
                    new_notif = Notification(
                        user_id=tx.user_id,
                        book_id=tx.book_id,
                        transaction_id=tx.id,
                        title=title,
                        message=msg,
                        notification_type=ntype,
                        due_date=due_date,
                        is_read=False,
                        created_at=now
                    )
                    db.add(new_notif)
                    created_count += 1

        db.commit()
        return created_count

    @staticmethod
    def format_notification(n: Notification) -> NotificationOut:
        now = datetime.utcnow()
        today = now.date()
        days_remaining = None
        is_overdue = False
        fine_amount = 0.0

        if n.due_date:
            due_day = n.due_date.date()
            delta = (due_day - today).days
            days_remaining = delta
            if delta < 0:
                is_overdue = True
                fine_amount = round(abs(delta) * settings.DAILY_FINE_RATE, 2)
        elif n.notification_type == "OVERDUE":
            is_overdue = True

        book_title = n.book.title if n.book else None
        book_cover = n.book.cover_image if n.book else None

        return NotificationOut(
            id=n.id,
            user_id=n.user_id,
            book_id=n.book_id,
            book_title=book_title,
            book_cover=book_cover,
            transaction_id=n.transaction_id,
            title=n.title,
            message=n.message,
            notification_type=n.notification_type,
            due_date=n.due_date,
            days_remaining=days_remaining,
            is_overdue=is_overdue,
            fine_amount=fine_amount,
            is_read=n.is_read,
            created_at=n.created_at
        )

    @staticmethod
    def get_user_notifications(
        db: Session,
        user_id: int,
        unread_only: bool = False,
        limit: int = 50,
        skip: int = 0
    ) -> List[NotificationOut]:
        query = db.query(Notification).filter(Notification.user_id == user_id)
        if unread_only:
            query = query.filter(Notification.is_read.is_(False))

        notifications = (
            query.order_by(desc(Notification.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )
        return [NotificationService.format_notification(n) for n in notifications]

    @staticmethod
    def get_unread_count(db: Session, user_id: int) -> int:
        return (
            db.query(Notification)
            .filter(
                Notification.user_id == user_id,
                Notification.is_read.is_(False)
            )
            .count()
        )

    @staticmethod
    def mark_as_read(db: Session, notification_id: int, user_id: int) -> bool:
        notif = (
            db.query(Notification)
            .filter(
                Notification.id == notification_id,
                Notification.user_id == user_id
            )
            .first()
        )
        if not notif:
            return False

        notif.is_read = True
        db.commit()
        return True

    @staticmethod
    def mark_all_as_read(db: Session, user_id: int) -> int:
        count = (
            db.query(Notification)
            .filter(
                Notification.user_id == user_id,
                Notification.is_read.is_(False)
            )
            .update({"is_read": True})
        )
        db.commit()
        return count


notification_service = NotificationService()
