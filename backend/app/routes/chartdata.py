import asyncio  # ⚡ Asynchrone Verarbeitung
import random
from datetime import datetime, timedelta, timezone
from random import randint
from typing import Any, Dict, List

from app.auth import get_current_user
from app.database import get_db
from app.models import MarketChange, MarketCluster, Product, ProductChange
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

router = APIRouter()

class LineChartDataResponse(BaseModel):
    x_axis: List[int]
    series: List[Dict[str, Any]]

@router.get("/get-line-chart-data", response_model=LineChartDataResponse)
async def get_line_chart_data(current_user=Depends(get_current_user)):
    await asyncio.sleep(1)  # ⏳ Simuliert eine asynchrone Verzögerung (z. B. langsame DB-Abfrage)
    return {
        "x_axis": [8, 9, 10],
        "series": [
            {"name": "Last 30 days", "data": [4, 2, 8]}
        ]
    }

class SparkLineDataResponse(BaseModel):
    data: List[int]

@router.get("/get-spark-line-data", response_model=SparkLineDataResponse)
async def get_spark_line_data(current_user=Depends(get_current_user)):
    await asyncio.sleep(1)  # ⏳ Simuliert Verzögerung
    return {"data": [random.randint(1, 10) for _ in range(9)]}


@router.get("/get-sparkline-grid-data/{asin}", response_model=List[int])
async def get_sparkline_grid_data(asin: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """
    Holt die letzten 30 Tage an Preisänderungen für ein Produkt und füllt Lücken auf.
    Falls das Produkt erst vor kurzem in die DB kam, beginnt die Liste ab diesem Datum.
    """

    # ✅ Produkt suchen
    product = db.query(Product).filter(Product.asin == asin).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produkt nicht gefunden")

    # ✅ ProductChanges der letzten 30 Tage abrufen
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=30)  # ✅ timezone-aware
    product_changes = (
        db.query(ProductChange)
        .filter(ProductChange.asin == asin, ProductChange.change_date.isnot(None), ProductChange.change_date >= cutoff_date)
        .order_by(ProductChange.change_date.asc())  # 🔹 Sortierung nach Datum (älteste zuerst)
        .all()
    )

    # ✅ Falls keine Änderungen vorhanden sind, gib eine leere Liste zurück
    if not product_changes:
        return []

    # ✅ Stelle sicher, dass `change_date` immer timezone-aware ist
    changes_with_dates = [
        change for change in product_changes if change.change_date is not None
    ]

    if not changes_with_dates:
        return []  # Falls alle change_date-Einträge `None` waren, leere Liste zurückgeben

    # ✅ Ältestes Änderungsdatum holen und sicherstellen, dass es timezone-aware ist
    first_change_date = min(
        change.change_date.replace(tzinfo=timezone.utc) for change in changes_with_dates
    )

    # ✅ Startdatum bestimmen (ältester Change oder max. 30 Tage zurück)
    start_date = max(cutoff_date, first_change_date)

    # ✅ Sicherstellen, dass `today` auch ein `datetime`-Objekt ist
    today = datetime.now(timezone.utc).date()  # Nur das Datum extrahieren

    # ✅ Liste mit relevanten Tagen erstellen
    date_list = []
    current_date = start_date.date()  # `date()` extrahieren, um Fehler zu vermeiden

    while current_date <= today:
        date_list.append(current_date.strftime("%Y-%m-%d"))
        current_date += timedelta(days=1)

    # ✅ Dictionary für Änderungen (Datum -> Preis)
    changes_dict = {
        change.change_date.strftime("%Y-%m-%d"): change.price
        for change in changes_with_dates
    }

    # ✅ Fehlende Werte mit vorherigem Wert füllen
    filled_data = []
    last_value = None

    for date in date_list:
        if date in changes_dict:
            last_value = changes_dict[date]  # ✅ Falls ein Change existiert, diesen Wert nehmen
        filled_data.append(int(last_value) if last_value is not None else 0)  # 🔹 Sicherstellen, dass nur Zahlen zurückgegeben werden

    return filled_data



@router.get("/get-stacked-bar-data-for-cluster/{cluster_id}")
async def get_stacked_bar_data_for_cluster(cluster_id: int, db: Session = Depends(get_db)):
    await asyncio.sleep(1)  # ⏳ Simulierte Verzögerung

    # 📌 MarketCluster abrufen
    market_cluster = db.query(MarketCluster).filter(MarketCluster.id == cluster_id).first()
    if not market_cluster:
        return {"error": "Market Cluster nicht gefunden"}

    # 📌 Alle zugehörigen Märkte abrufen
    markets = market_cluster.markets

    # 📌 Die letzten 30 Tage berechnen
    cutoff_date = datetime.now() - timedelta(days=30)

    # 📌 Dictionary für die Markt-Daten vorbereiten
    market_data = {}

    for market in markets:
        # 📌 Alle MarketChanges innerhalb der letzten 30 Tage holen
        changes = (
            db.query(MarketChange)
            .filter(MarketChange.market_id == market.id, MarketChange.change_date >= cutoff_date)
            .order_by(MarketChange.change_date)
            .all()
        )

        if not changes:
            continue  # ⏩ Falls keine Änderungen existieren, diesen Markt überspringen

        # 🏁 Startdatum = Das früheste `change_date` aus den MarketChanges (aber maximal 30 Tage alt)
        start_date = max(cutoff_date.date(), changes[0].change_date.date())  # ✅ Fix angewendet

        # 🏁 Heutiges Datum
        today = datetime.now().date()

        # 📌 Werte initialisieren mit dem ersten gefundenen Wert
        last_value = changes[0].total_revenue if changes[0].total_revenue else 0

        # 📌 Die X-Achse mit Daten von `start_date` bis `heute` füllen
        market_data[market.keyword] = []
        current_date = start_date

        while current_date <= today:
            numeric_date = current_date.toordinal()  # 🔥 Umwandlung in Zahl für die X-Achse

            # Prüfen, ob es an diesem Tag ein MarketChange gibt
            change_today = next((c for c in changes if c.change_date.date() == current_date), None)
            if change_today:
                last_value = change_today.total_revenue if change_today.total_revenue else last_value

            # 📌 Werte speichern
            market_data[market.keyword].append({"date": numeric_date, "value": last_value})

            # ⏩ Zum nächsten Tag wechseln
            current_date += timedelta(days=1)

    return {"stackedData": market_data}



@router.get("/get-sparkline-data-for-market-cluster/{cluster_id}", response_model=List[int])
async def get_sparkline_data_for_market_cluster(cluster_id: int, db: Session = Depends(get_db)) -> List[int]:
    """
    Holt die aggregierte Umsatzentwicklung für ein MarketCluster als Liste von Integer-Werten.
    Falls ein Markt keine Änderung an einem Tag hat, wird der letzte bekannte Wert übernommen.
    """
    await asyncio.sleep(1)  # Simulierte Verzögerung für realistischere Ladezeiten

    # 📌 MarketCluster abrufen
    market_cluster = db.query(MarketCluster).filter(MarketCluster.id == cluster_id).first()
    if not market_cluster:
        return []

    # 📌 Alle zugehörigen Märkte abrufen
    markets = market_cluster.markets

    # 📌 Die letzten 30 Tage berechnen
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=30)  # ✅ timezone-aware

    # 📌 Alle MarketChanges abrufen (maximal 30 Tage zurück)
    market_changes = (
        db.query(MarketChange)
        .filter(MarketChange.market_id.in_([m.id for m in markets]), MarketChange.change_date >= cutoff_date)
        .order_by(MarketChange.change_date)
        .all()
    )

    if not market_changes:
        return []

    # 📌 Earliest Change Date bestimmen (aber nicht älter als cutoff_date)
    earliest_change_date = max(
        min((mc.change_date.replace(tzinfo=timezone.utc) for mc in market_changes), default=cutoff_date),
        cutoff_date
    ).date()  # ✅ Sicherstellen, dass es ein `date`-Objekt ist

    # 📌 Heute als Enddatum setzen
    today = datetime.now(timezone.utc).date()

    # 📌 Liste für aggregierte Umsätze initialisieren
    sparkline_data = []

    # 📌 Letzte bekannte Werte für jeden Markt initialisieren
    last_market_values = {market.id: 0 for market in markets}

    # 📌 Iteration über die Zeitreihe
    current_date = earliest_change_date
    while current_date <= today:
        total_revenue = 0  # Tagesumsatz für das gesamte Cluster

        for market in markets:
            # 🔍 Letzte bekannte Umsatzänderung für diesen Markt abrufen
            change_today = next((mc for mc in market_changes if mc.market_id == market.id and mc.change_date.date() == current_date), None)

            if change_today:
                last_market_values[market.id] = change_today.total_revenue if change_today.total_revenue else last_market_values[market.id]

            total_revenue += last_market_values[market.id]  # Summe für den Cluster

        # 📌 Speichere den Wert in der Sparkline-Liste
        sparkline_data.append(int(total_revenue))

        # ⏩ Zum nächsten Tag wechseln
        current_date += timedelta(days=1)

    return sparkline_data  # 🔥 KEINE ZEITACHSE – nur die Liste mit Werten

@router.get("/get-bar-chart-data")
async def get_bar_chart_data():
    await asyncio.sleep(1)  # ⏳ Simuliert Verzögerung
    quarters = ["Q1", "Q2", "Q3", "Q4"]
    data = [
        {
            "quarter": quarter,
            "series1": randint(10, 60),
            "series2": randint(10, 60),
            "series3": randint(10, 60),
            "series4": randint(10, 60),
        }
        for quarter in quarters
    ]
    return {"barChart": data}
