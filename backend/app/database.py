import sqlite3
import os
from dotenv import load_dotenv
from passlib.context import CryptContext

# .env Datei laden
load_dotenv()

# Passwort-Hashing Setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

database_url = os.getenv("DATABASE_URL", "users.db")

# Falls eine SQLAlchemy-URL (`sqlite:///./users.db`) gesetzt ist, extrahiere den Dateipfad
if database_url.startswith("sqlite:///"):
    db_path = database_url.replace("sqlite:///", "")
else:
    db_path = database_url

# Sicherstellen, dass die Datenbankdatei existiert
if not os.path.exists(db_path):
    open(db_path, 'w').close()  # Leere Datei erstellen

# Verbindung zur Datenbank herstellen
def get_db_connection():
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # Ermöglicht den Zugriff auf Spalten per Namen
    return conn

# Datenbank und Tabellen initialisieren
conn = get_db_connection()
c = conn.cursor()
c.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        hashed_password TEXT
    )
''')

# Überprüfen, ob der Admin-Benutzer existiert, sonst erstellen
c.execute("SELECT * FROM users WHERE username = ?", ("admin",))
if not c.fetchone():
    admin_hashed_password = get_password_hash("admin123")
    c.execute("INSERT INTO users (username, hashed_password) VALUES (?, ?)", ("admin", admin_hashed_password))
    print("Admin-Benutzer wurde erstellt!")

conn.commit()
conn.close()
