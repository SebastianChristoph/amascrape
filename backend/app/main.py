from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import users

from database import init_db

app = FastAPI()

# Datenbank initialisieren
init_db()

# start with python -m uvicorn app.main:app --reload

# ✅ CORS Middleware aktivieren
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Erlaubt Anfragen von allen Domains (Frontend & API)
    allow_credentials=True,
    allow_methods=["*"],  # Erlaubt alle HTTP-Methoden (GET, POST, PUT, DELETE)
    allow_headers=["*"],  # Erlaubt alle HTTP-Header
)

# Routen registrieren
app.include_router(users.router, prefix="/users", tags=["Users"])

@app.get("/")
def root():
    return {"message": "Welcome to the FastAPI Auth System"}
