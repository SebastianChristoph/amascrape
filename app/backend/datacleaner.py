import re
import os
from sqlalchemy import create_engine, MetaData, Table, update, inspect
from sqlalchemy.exc import OperationalError, NoSuchTableError

DATABASE_URL = 'sqlite:///backend/marketdata.db'
engine = create_engine(DATABASE_URL)

print("Verwendete DB:", os.path.abspath('backend/marketdata.db'))

# Prüfe Verbindung zur Datenbank
try:
    connection = engine.connect()
    connection.close()
    print("✅ Datenbankverbindung hergestellt.")
except OperationalError as e:
    print(f"❌ Datenbankverbindung fehlgeschlagen: {e}")
    exit()

metadata = MetaData()
metadata.reflect(bind=engine)

inspector = inspect(engine)
if 'product_changes' not in inspector.get_table_names():
    print("❌ Tabelle 'product_changes' existiert nicht in der Datenbank.")
    exit()

product_changes = Table('product_changes', metadata, autoload_with=engine)

def clean_changes(changes):
    if not changes:
        return changes

    changes_clean = re.sub(r'[^\w\s,|]', '', changes)
    changes_clean = changes_clean.replace('|', ',')
    changes_clean = re.sub(r'\s*,\s*', ', ', changes_clean)

    return changes_clean.strip()

# explizite Transaktion
with engine.begin() as connection:
    results = connection.execute(product_changes.select()).fetchall()

    for row in results:
        original_changes = row._mapping['changes']
        cleaned_changes = clean_changes(original_changes)

        if original_changes != cleaned_changes:
            stmt = (
                update(product_changes)
                .where(product_changes.c.id == row._mapping['id'])
                .values(changes=cleaned_changes)
            )
            connection.execute(stmt)

print("✅ Die Spalte <changes> wurde erfolgreich bereinigt.")
