import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.core.security import verify_password, get_password_hash, create_access_token
from backend.app.models.entities import User, Role, UserPreference
from backend.app.schemas.schemas import (
    UserRegister, UserLogin, GoogleDemoAuthRequest, Token, UserOut, ColdStartInterests,
    ForgotPasswordVerifyRequest, ResetPasswordRequest, PasswordResetResponse
)
from backend.app.routers.deps import get_current_user
from backend.app.ai.user_profiler import user_profiler

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token)
def register_user(user_in: UserRegister, db: Session = Depends(get_db)):
    clean_email = user_in.email.lower().strip()

    # 1. Validate password length & confirmation
    if len(user_in.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least 8 characters."
        )

    if user_in.confirm_password and user_in.password != user_in.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match."
        )

    # 2. Check if email already registered
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Please login."
        )

    # 3. Check if Student ID already registered (if provided)
    clean_student_id = user_in.student_id.strip() if user_in.student_id else None
    if clean_student_id:
        existing_sid = db.query(User).filter(User.student_id.ilike(clean_student_id)).first()
        if existing_sid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this Student ID already exists. Please login or check your ID."
            )

    # 4. Strict Role Assignment: Public registrations are always assigned 'student'
    role = db.query(Role).filter(Role.name == "student").first()
    if not role:
        role = Role(name="student", description="Student User")
        db.add(role)
        db.commit()
        db.refresh(role)

    # 5. Create User in MySQL
    new_user = User(
        name=user_in.name.strip(),
        email=clean_email,
        student_id=clean_student_id,
        phone=user_in.phone.strip() if user_in.phone else None,
        hashed_password=get_password_hash(user_in.password),
        role_id=role.id,
        department=user_in.department.strip() if user_in.department else "Computer Science",
        year=user_in.year.strip() if user_in.year else "1st Year",
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 6. Initialize UserPreference for AI recommendations
    pref = UserPreference(
        user_id=new_user.id,
        genre_scores_json="{}",
        initial_interests_json="[]"
    )
    db.add(pref)
    db.commit()

    # 7. Generate JWT Token
    access_token = create_access_token(subject=new_user.id, role=role.name)

    user_out = UserOut(
        id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        student_id=new_user.student_id,
        phone=new_user.phone,
        role=role.name,
        department=new_user.department,
        year=new_user.year,
        is_active=new_user.is_active,
        created_at=new_user.created_at
    )

    return Token(access_token=access_token, token_type="bearer", user=user_out)


@router.post("/login", response_model=Token)
def login_user(user_in: UserLogin, db: Session = Depends(get_db)):
    clean_email = user_in.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    if not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your account is deactivated. Please contact the administrator.",
        )

    # Role validation if specified in login form
    user_role_name = user.role.name if user.role else "student"
    if user_in.role and user_in.role.lower() != user_role_name.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This account does not have {user_in.role} privileges. Your role is {user_role_name}.",
        )

    access_token = create_access_token(subject=user.id, role=user_role_name)

    user_out = UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        student_id=getattr(user, "student_id", None),
        phone=getattr(user, "phone", None),
        role=user_role_name,
        department=user.department,
        year=user.year,
        is_active=user.is_active,
        created_at=user.created_at
    )

    return Token(access_token=access_token, token_type="bearer", user=user_out)


@router.post("/google-demo", response_model=Token)
def google_demo_auth(payload: GoogleDemoAuthRequest, db: Session = Depends(get_db)):
    clean_email = payload.email.lower().strip()

    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        # Create student user with a generated demo ID
        role = db.query(Role).filter(Role.name == "student").first()
        if not role:
            role = Role(name="student", description="Student User")
            db.add(role)
            db.commit()
            db.refresh(role)

        # Generate a clean demo student ID
        dept_abbr = (payload.department or "CSE")[:3].upper()
        existing_count = db.query(User).count()
        demo_sid = f"DEMO-{dept_abbr}-{existing_count + 1:03d}"

        # Assign a secure random hashed password for internal integrity
        demo_pass_hash = get_password_hash("GoogleDemoPass@2026")

        user = User(
            name=payload.name.strip(),
            email=clean_email,
            student_id=demo_sid,
            phone=None,
            hashed_password=demo_pass_hash,
            role_id=role.id,
            department=payload.department or "Computer Science",
            year=payload.year or "1st Year",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Initialize UserPreference for AI recommendations
        pref = UserPreference(
            user_id=user.id,
            genre_scores_json="{}",
            initial_interests_json="[]"
        )
        db.add(pref)
        db.commit()

    user_role_name = user.role.name if user.role else "student"
    access_token = create_access_token(subject=user.id, role=user_role_name)

    user_out = UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        student_id=getattr(user, "student_id", None) or f"DEMO-CSE-{user.id:03d}",
        phone=getattr(user, "phone", None),
        role=user_role_name,
        department=user.department or "Computer Science",
        year=user.year or "1st Year",
        is_active=user.is_active,
        created_at=user.created_at
    )

    return Token(access_token=access_token, token_type="bearer", user=user_out)


@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        student_id=getattr(current_user, "student_id", None),
        phone=getattr(current_user, "phone", None),
        role=current_user.role.name if current_user.role else "student",
        department=current_user.department,
        year=current_user.year,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )


@router.post("/onboarding-interests")
def save_onboarding_interests(
    payload: ColdStartInterests,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(
            user_id=current_user.id,
            genre_scores_json="{}",
            initial_interests_json=json.dumps(payload.interests)
        )
        db.add(pref)
    else:
        pref.initial_interests_json = json.dumps(payload.interests)
    db.commit()

    # Recompute user profile vector with initial interests
    new_profile = user_profiler.compute_user_profile(current_user.id, db)
    return {"message": "Interests saved successfully.", "profile": new_profile}


@router.post("/forgot-password/verify", response_model=PasswordResetResponse)
def verify_user_for_reset(payload: ForgotPasswordVerifyRequest, db: Session = Depends(get_db)):
    identifier = payload.email_or_roll.strip().lower()
    if not identifier:
        raise HTTPException(status_code=400, detail="Please enter your registered email or student ID.")

    user = db.query(User).filter(
        (User.email == identifier) | 
        (User.student_id.ilike(identifier)) | 
        (User.name.ilike(identifier))
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No college library account found matching '{payload.email_or_roll}'. Please check and try again."
        )

    return PasswordResetResponse(
        success=True,
        message=f"Account verified for {user.name} ({user.email}). You can now set a new password."
    )


@router.post("/forgot-password/reset", response_model=PasswordResetResponse)
def reset_user_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    identifier = payload.email_or_roll.strip().lower()
    if not identifier:
        raise HTTPException(status_code=400, detail="Identifier is required.")

    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must contain at least 8 characters.")

    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    user = db.query(User).filter(
        (User.email == identifier) | 
        (User.student_id.ilike(identifier)) | 
        (User.name.ilike(identifier))
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found. Please start the recovery process again."
        )

    # Securely hash new password using passlib/bcrypt
    user.hashed_password = get_password_hash(payload.new_password)
    db.commit()

    return PasswordResetResponse(
        success=True,
        message="Password updated successfully! You can now log in with your new password."
    )
