# backend/app/tests/routes/test_admin_routes.py

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.auth import get_db, get_current_user
from app.models import User

# TestClient für FastAPI-App
client = TestClient(app)

# Dummy-User-Klasse
class DummyUser:
    def __init__(self, id, credits):
        self.id = id
        self.credits = credits

# Dummy-DB-Klasse
class DummyDB:
    def __init__(self):
        self.user = DummyUser(id=1, credits=100)

    def query(self, model):
        return self

    def filter(self, *args):
        return self

    def first(self):
        return self.user

    def commit(self):
        pass

    def refresh(self, user):
        pass

class DummyDBUserNotFound:
    def query(self, model):
        return self
    def filter(self, *args):
        return self
    def first(self):
        return None  # Simuliert: User nicht gefunden
    def commit(self):
        pass
    def refresh(self, user):
        pass

# Mock-User mit Adminrechten
def mock_current_user():
    return User(id=999, is_admin=True)

def mock_non_admin_user():
    return User(id=100, is_admin=False)


def test_add_credits_not_admin():
    app.dependency_overrides[get_current_user] = mock_non_admin_user
    app.dependency_overrides[get_db] = lambda: DummyDB()  # User existiert
    
    response = client.post("/admin/add-credits/1", json={"credits": 50})
    assert response.status_code == 403
    assert response.json()["detail"] == "Not authorized"

def test_add_credits_user_not_found():
    app.dependency_overrides[get_current_user] = mock_current_user  # Admin
    app.dependency_overrides[get_db] = lambda: DummyDBUserNotFound()
    
    response = client.post("/admin/add-credits/999", json={"credits": 50})
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"