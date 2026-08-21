import re
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database import get_db
from backend.app.models.entities import Category, Book, User
from backend.app.schemas.schemas import CategoryOut, CategoryCreate
from backend.app.routers.deps import require_role

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=List[CategoryOut])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    counts = dict(
        db.query(Book.category_id, func.count(Book.id))
        .group_by(Book.category_id)
        .all()
    )

    results = []
    for c in categories:
        results.append(CategoryOut(
            id=c.id,
            name=c.name,
            slug=c.slug,
            icon=c.icon or "Book",
            description=c.description,
            book_count=counts.get(c.id, 0)
        ))
    return results


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    cat_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "librarian"]))
):
    existing = db.query(Category).filter(Category.name.ilike(cat_in.name.strip())).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category with this name already exists.")

    slug = cat_in.slug or re.sub(r"[^\w]+", "-", cat_in.name.lower()).strip("-")
    new_cat = Category(
        name=cat_in.name.strip(),
        slug=slug,
        icon=cat_in.icon or "Book",
        description=cat_in.description
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)

    return CategoryOut(
        id=new_cat.id,
        name=new_cat.name,
        slug=new_cat.slug,
        icon=new_cat.icon,
        description=new_cat.description,
        book_count=0
    )


@router.put("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int,
    cat_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")

    cat.name = cat_in.name.strip()
    if cat_in.slug:
        cat.slug = cat_in.slug
    if cat_in.icon:
        cat.icon = cat_in.icon
    if cat_in.description:
        cat.description = cat_in.description

    db.commit()
    db.refresh(cat)

    count = db.query(Book).filter(Book.category_id == cat.id).count()
    return CategoryOut(
        id=cat.id,
        name=cat.name,
        slug=cat.slug,
        icon=cat.icon,
        description=cat.description,
        book_count=count
    )


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")

    book_count = db.query(Book).filter(Book.category_id == cat.id).count()
    if book_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete category because it contains {book_count} books. Move books to another category first."
        )

    db.delete(cat)
    db.commit()
    return {"message": "Category deleted successfully."}
