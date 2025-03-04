from fastapi import FastAPI
from app.routes import users

app = FastAPI()

# Routen registrieren
app.include_router(users.router, prefix="/users", tags=["Users"])

@app.get("/")
def root():
    return {"message": "Welcome to the FastAPI Auth System"}
