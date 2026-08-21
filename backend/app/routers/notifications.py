from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.entities import User, Notification
from backend.app.schemas.schemas import NotificationOut, UnreadCountOut, MarkReadResponse
from backend.app.routers.deps import get_current_user, require_role
from backend.app.services.notification_service import notification_service

router = APIRouter(prefix="/notifications", tags=["Notifications & Alerts"])


@router.get("", response_model=List[NotificationOut])
def get_my_notifications(
    unread_only: bool = Query(False, description="Filter only unread notifications"),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get notifications for the logged-in student/user.
    Automatically checks due dates and overdue statuses on fetch.
    """
    # Trigger real-time due-date evaluation for current user
    notification_service.generate_due_date_notifications(db, target_user_id=current_user.id)

    return notification_service.get_user_notifications(
        db=db,
        user_id=current_user.id,
        unread_only=unread_only,
        limit=limit,
        skip=skip
    )


@router.get("/unread-count", response_model=UnreadCountOut)
def get_unread_notification_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fast query for unread notification count (used by the Notification Bell badge).
    """
    # Quick check for current user loans
    notification_service.generate_due_date_notifications(db, target_user_id=current_user.id)
    count = notification_service.get_unread_count(db, current_user.id)
    return UnreadCountOut(unread_count=count)


@router.post("/{notification_id}/read", response_model=MarkReadResponse)
@router.patch("/{notification_id}/read", response_model=MarkReadResponse)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark a single notification as read.
    """
    success = notification_service.mark_as_read(db, notification_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or access unauthorized."
        )
    return MarkReadResponse(success=True, message="Notification marked as read.")


@router.post("/mark-all-read", response_model=MarkReadResponse)
@router.patch("/mark-all-read", response_model=MarkReadResponse)
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark all unread notifications for the current user as read.
    """
    count = notification_service.mark_all_as_read(db, current_user.id)
    return MarkReadResponse(
        success=True,
        message=f"Successfully marked {count} notifications as read."
    )


@router.post("/check-due-dates")
def trigger_due_date_check(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Triggers an on-demand due-date scanning pass.
    Librarians/Admins scan all library transactions; students scan their own active loans.
    """
    is_staff = current_user.role and current_user.role.name in ["librarian", "admin"]
    target_id = None if is_staff else current_user.id
    
    count = notification_service.generate_due_date_notifications(db, target_user_id=target_id)
    return {
        "success": True,
        "created_count": count,
        "message": f"Due-date notification scan completed. {count} new alerts generated."
    }


@router.delete("/{notification_id}", response_model=MarkReadResponse)
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a notification.
    """
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found."
        )
    db.delete(notif)
    db.commit()
    return MarkReadResponse(success=True, message="Notification deleted.")
