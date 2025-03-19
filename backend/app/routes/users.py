from typing import List
import os  # 📌 Fehlender Import
from datetime import datetime, timezone

from app.auth import (authenticate_user, create_access_token, generate_verification_token, get_current_user, get_expiration_time,
                      get_password_hash, is_admin)
from app.database import get_db
from app.models import User
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema

router = APIRouter()

# 📌 User-Registrierung Schema
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    password_repeat: str  # 

# 📧 Mail-Konfiguration (mit .env Werten)
MAIL_CONFIG = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", "dein-email@gmail.com"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", "dein-passwort"),
    MAIL_FROM=os.getenv("MAIL_FROM", "dein-email@gmail.com"),
    MAIL_FROM_NAME="Mein Unternehmen",
    MAIL_PORT=587,  # Falls du SSL nutzt, ändere auf 465
    MAIL_SERVER="smtp.gmail.com",  # SMTP-Server für Gmail (ändere, falls nötig)
    MAIL_STARTTLS=True,  # ✅ Erforderlich für TLS
    MAIL_SSL_TLS=False,  # ✅ Erforderlich für neue `fastapi-mail` Version
)

# 📌 Registrierung mit E-Mail-Verifikation
@router.post("/register")
async def register(user: UserCreate, db: Session = Depends(get_db)):
    if user.password != user.password_repeat:
        raise HTTPException(status_code=400, detail="Passwörter stimmen nicht überein.")

    existing_user = db.query(User).filter(
        (User.username == user.username) | (User.email == user.email)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Benutzername oder E-Mail bereits vergeben.")

    verification_token = generate_verification_token()
    expiration_time = get_expiration_time()

    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=get_password_hash(user.password),
        is_verified=False,
        verification_token=verification_token,
        verification_token_expires=expiration_time,
    )
    db.add(new_user)
    db.commit()

    # 📌 Hier kommt der Mock! Statt E-Mail wird der Link im API-Response zurückgegeben
    verification_link = f"http://localhost:5173/verify/{verification_token}"

    return {
        "message": "Registrierung erfolgreich! Bitte prüfe die angezeigte E-Mail.",
        "mocked_verification_link": verification_link  # ✅ Für Frontend-Anzeige
    }


# 📧 Verifizierungs-E-Mail senden
async def send_verification_email(email: str, username: str, token: str, expires: datetime):
    expiration_time_formatted = expires.astimezone(timezone.utc).strftime("%H:%M UTC")
    verification_link = f"http://127.0.0.1:9000/users/verify/{token}"

    message_body = f"""
    Hallo {username},

    Bitte klicke auf den folgenden Link, um dein Konto zu aktivieren:
    
    {verification_link}
    
    ⚠️ **Wichtig:** Der Link ist nur bis {expiration_time_formatted} gültig (30 Minuten).

    Falls du dich nicht registriert hast, kannst du diese E-Mail ignorieren.

    Viele Grüße,
    Dein Team
    """

    message = MessageSchema(
        subject="Verifiziere dein Konto",
        recipients=[email],
        body=message_body,
        subtype="plain",
    )

    fm = FastMail(MAIL_CONFIG)
    await fm.send_message(message)

# 📌 Verifizierungs-Route
@router.get("/verify/{token}")
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Ungültiger oder abgelaufener Token.")

    # 📌 **Fix: Beide Datumswerte in "offset-aware" umwandeln**
    if user.verification_token_expires:
        expires_aware = user.verification_token_expires.replace(tzinfo=timezone.utc)
        now_aware = datetime.now(timezone.utc)

        if expires_aware < now_aware:
            raise HTTPException(status_code=400, detail="Der Verifizierungslink ist abgelaufen. Bitte registriere dich erneut.")

    # ✅ Benutzer als verifiziert markieren
    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires = None  # Ablaufzeit zurücksetzen
    db.commit()

    print(f"✅ Benutzer {user.username} ({user.email}) erfolgreich verifiziert!")  # Debug-Info

    return {
        "message": "E-Mail erfolgreich verifiziert! Du kannst dich jetzt einloggen.",
        "username": user.username,
        "email": user.email,
    }

# 📌 Token-Generierung (Login)
@router.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user or not user.is_verified:  # 📌 Benutzer muss verifiziert sein!
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Falsche Anmeldedaten oder Konto nicht verifiziert",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token({"username": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


def is_admin(user: User):
    return user.username == "admin"

@router.get("/admin")
def admin_access(user: User = Depends(get_current_user)):
    print("auf route admin")
    if not is_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Zugriff verweigert. Nur Admins erlaubt."
        )
    return {"message": "Willkommen im Admin-Bereich!"}

class UserCreateRequest(BaseModel):
    username: str
    email: str
    password: str

# ✅ Admin kann Benutzer ohne Bestätigungslink anlegen
@router.post("/admin/create")
def create_user_admin(user: UserCreateRequest, db: Session = Depends(get_db), admin: User = Depends(get_current_user)):
    if admin.username != "admin":
        raise HTTPException(status_code=403, detail="Zugriff verweigert. Nur Admins dürfen neue Benutzer anlegen.")
    
    if user.username == "" or user.email == "" or user.password == "":
        raise HTTPException(status_code=400, detail="Mindestens ein Feld ist leer")

    existing_user = db.query(User).filter((User.username == user.username) | (User.email == user.email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Benutzername oder E-Mail bereits vergeben.")

    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=get_password_hash(user.password),
        is_verified=True,  # ✅ Direkte Verifizierung, kein Token notwendig
        verification_token=None,
        verification_token_expires=None
    )

    db.add(new_user)
    db.commit()
    return {"message": f"Benutzer {user.username} wurde erfolgreich erstellt."}

# ✅ Admin kann Benutzer löschen
@router.delete("/admin/delete/{user_id}")
def delete_user_admin(user_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_user)):
    if not is_admin(admin):
        raise HTTPException(status_code=403, detail="Zugriff verweigert. Nur Admins dürfen Benutzer löschen.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden.")

    db.delete(user)
    db.commit()
    return {"message": f"Benutzer {user.username} wurde gelöscht."}

@router.get("/admin/all-users")
def get_all_users(db: Session = Depends(get_db), admin: User = Depends(get_current_user)):
    if admin.username != "admin":
        raise HTTPException(status_code=403, detail="Zugriff verweigert. Nur Admins erlaubt.")

    users = db.query(User).all()
    return [{"id": user.id, "username": user.username, "email": user.email} for user in users]
