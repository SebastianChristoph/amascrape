from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import users
from app.database import init_db

app = FastAPI()

# start with
# python -m uvicorn app.main:app --host 0.0.0.0 --port 9000 --reload


# Datenbank initialisieren
init_db()

# ✅ CORS Middleware aktivieren
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 📌 Router registrieren
app.include_router(users.router, prefix="/users", tags=["Users"])

@app.get("/")
def root():
    return {"message": "Welcome to the FastAPI Auth System"}
