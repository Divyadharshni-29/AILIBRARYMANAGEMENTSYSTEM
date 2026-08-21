from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.database import get_db
from backend.app.core.security import get_password_hash
from backend.app.models.entities import User, Role, Book, Transaction
from backend.app.schemas.schemas import UserOut, UserRegister, UserUpdate
from backend.app.routers.deps import require_role

router = APIRouter(prefix="/admin", tags=["Admin Operations"])


@router.get("/users", response_model=List[UserOut])
def get_all_users(
    role_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["librarian", "admin"]))
):
    query = db.query(User).join(Role)
    if role_filter:
        query = query.filter(Role.name == role_filter.lower())

    users = query.order_by(desc(User.created_at)).all()
    return [
        UserOut(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role.name if u.role else "student",
            department=u.department,
            year=u.year,
            is_active=u.is_active,
            created_at=u.created_at
        )
        for u in users
    ]


@router.post("/librarians", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_librarian(
    payload: UserRegister,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered.")

    librarian_role = db.query(Role).filter(Role.name == "librarian").first()
    if not librarian_role:
        librarian_role = Role(name="librarian", description="Library Staff")
        db.add(librarian_role)
        db.commit()
        db.refresh(librarian_role)

    new_lib = User(
        name=payload.name,
        email=payload.email.lower(),
        hashed_password=get_password_hash(payload.password),
        role_id=librarian_role.id,
        department="Library Services",
        year="Staff",
        is_active=True
    )
    db.add(new_lib)
    db.commit()
    db.refresh(new_lib)

    return UserOut(
        id=new_lib.id,
        name=new_lib.name,
        email=new_lib.email,
        role="librarian",
        department=new_lib.department,
        year=new_lib.year,
        is_active=new_lib.is_active,
        created_at=new_lib.created_at
    )


@router.put("/users/{user_id}", response_model=UserOut)
def update_user_status(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if payload.name is not None:
        user.name = payload.name
    if payload.department is not None:
        user.department = payload.department
    if payload.year is not None:
        user.year = payload.year
    if payload.is_active is not None:
        user.is_active = payload.is_active

    if payload.role:
        role_record = db.query(Role).filter(Role.name == payload.role.lower()).first()
        if role_record:
            user.role_id = role_record.id

    db.commit()
    db.refresh(user)

    return UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role.name if user.role else "student",
        department=user.department,
        year=user.year,
        is_active=user.is_active,
        created_at=user.created_at
    )


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete your own admin account.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    active_tx = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.status.in_(["BORROWED", "OVERDUE"])
    ).count()

    if active_tx > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete user with {active_tx} active borrowed books pending return."
        )

    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully."}
