from pydantic import BaseModel

# 📌 Basis-User Schema (Wird von anderen User-Schemas geerbt)
class UserBase(BaseModel):
    username: str

# 📌 Schema für die User-Registrierung (erwartet Passwort)
class UserCreate(UserBase):
    password: str

# 📌 Schema für die API-Antwort eines Users (enthält ID)
class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True  # ✅ Ermöglicht automatische Umwandlung von SQLAlchemy-Objekten

# 📌 Token-Schema für Authentifizierung
class Token(BaseModel):
    access_token: str
    token_type: str

# 📌 Schema für Token-Daten (Optionaler Username aus dem Token)
class TokenData(BaseModel):
    username: str | None = None
