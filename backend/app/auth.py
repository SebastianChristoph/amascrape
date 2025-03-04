import sqlite3
import os
from dotenv import load_dotenv
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta

# .env Datei laden
load_dotenv()

# Umgebungsvariablen aus .env lesen
db_path = os.getenv("DATABASE_URL", "users.db")
SECRET_KEY = os.getenv("SECRET_KEY", "default_secret_key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_db_connection():
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # Ermöglicht den Zugriff auf Spalten per Namen
    return conn

def get_user(username: str):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT username, hashed_password FROM users WHERE username = ?", (username,))
    user = c.fetchone()
    conn.close()
    return user

def authenticate_user(username: str, password: str):
    user = get_user(username)
    if user and verify_password(password, user[1]):
        return user
    return None
