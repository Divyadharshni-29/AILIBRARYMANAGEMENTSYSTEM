from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.entities import LibraryLocation, Category, Book, User
from backend.app.schemas.schemas import LibraryLocationOut, LibraryLocationCreate, LibraryLocationUpdate
from backend.app.routers.deps import get_current_user, require_role

router = APIRouter(prefix="/locations", tags=["College Library Locations"])


@router.get("", response_model=List[LibraryLocationOut])
def get_library_locations(
    floor: Optional[str] = None,
    section: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(LibraryLocation)
    if floor and floor.upper() != "ALL":
        query = query.filter(LibraryLocation.floor.ilike(f"%{floor}%"))
    if section and section.upper() != "ALL":
        query = query.filter(LibraryLocation.section.ilike(f"%{section}%"))

    locations = query.order_by(LibraryLocation.floor, LibraryLocation.section, LibraryLocation.shelf).all()
    results = []
    for loc in locations:
        results.append(
            LibraryLocationOut(
                id=loc.id,
                building=loc.building,
                floor=loc.floor,
                section=loc.section,
                shelf=loc.shelf,
                rack=loc.rack,
                description=loc.description,
                category_id=loc.category_id,
                category_name=loc.category.name if loc.category else None,
                created_at=loc.created_at
            )
        )
    return results


@router.post("", response_model=LibraryLocationOut, status_code=status.HTTP_201_CREATED)
def create_library_location(
    payload: LibraryLocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["librarian", "admin"]))
):
    loc = LibraryLocation(
        building=payload.building.strip(),
        floor=payload.floor.strip(),
        section=payload.section.strip(),
        shelf=payload.shelf.strip(),
        rack=payload.rack.strip(),
        description=payload.description.strip() if payload.description else None,
        category_id=payload.category_id
    )
    db.add(loc)
    db.commit()
    db.refresh(loc)

    return LibraryLocationOut(
        id=loc.id,
        building=loc.building,
        floor=loc.floor,
        section=loc.section,
        shelf=loc.shelf,
        rack=loc.rack,
        description=loc.description,
        category_id=loc.category_id,
        category_name=loc.category.name if loc.category else None,
        created_at=loc.created_at
    )


@router.put("/{location_id}", response_model=LibraryLocationOut)
def update_library_location(
    location_id: int,
    payload: LibraryLocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["librarian", "admin"]))
):
    loc = db.query(LibraryLocation).filter(LibraryLocation.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Library location not found.")

    if payload.building is not None:
        loc.building = payload.building.strip()
    if payload.floor is not None:
        loc.floor = payload.floor.strip()
    if payload.section is not None:
        loc.section = payload.section.strip()
    if payload.shelf is not None:
        loc.shelf = payload.shelf.strip()
    if payload.rack is not None:
        loc.rack = payload.rack.strip()
    if payload.description is not None:
        loc.description = payload.description.strip()
    if payload.category_id is not None:
        loc.category_id = payload.category_id

    db.commit()
    db.refresh(loc)

    return LibraryLocationOut(
        id=loc.id,
        building=loc.building,
        floor=loc.floor,
        section=loc.section,
        shelf=loc.shelf,
        rack=loc.rack,
        description=loc.description,
        category_id=loc.category_id,
        category_name=loc.category.name if loc.category else None,
        created_at=loc.created_at
    )


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_library_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["librarian", "admin"]))
):
    loc = db.query(LibraryLocation).filter(LibraryLocation.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Library location not found.")

    db.delete(loc)
    db.commit()
    return None
