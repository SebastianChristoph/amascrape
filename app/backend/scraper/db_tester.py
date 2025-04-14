
from sqlalchemy.orm import Session
from app.models import ProductChange
from app.database import SessionLocal

def get_latest_product_change(db: Session, asin):
        return (
            db.query(ProductChange)
            .filter(ProductChange.asin == asin)
            .order_by(ProductChange.change_date.desc())
            .first()
        )

db = SessionLocal()

result = get_latest_product_change(db, "B0D46D3TRS")
field = getattr(result, "main_category_rank")
print(field)
print(type(field))