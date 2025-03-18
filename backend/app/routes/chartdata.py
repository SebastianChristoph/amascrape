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
from collections import defaultdict


router = APIRouter()


class LineChartDataResponse(BaseModel):
    x_axis: List[int]
    series: List[Dict[str, Any]]


@router.get("/get-line-chart-data", response_model=LineChartDataResponse)
async def get_line_chart_data(current_user=Depends(get_current_user)):
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
    cutoff_date = datetime.now(timezone.utc) - \
        timedelta(days=30)  # ✅ timezone-aware
    product_changes = (
        db.query(ProductChange)
        .filter(ProductChange.asin == asin, ProductChange.change_date.isnot(None), ProductChange.change_date >= cutoff_date)
        # 🔹 Sortierung nach Datum (älteste zuerst)
        .order_by(ProductChange.change_date.asc())
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
            # ✅ Falls ein Change existiert, diesen Wert nehmen
            last_value = changes_dict[date]
        # 🔹 Sicherstellen, dass nur Zahlen zurückgegeben werden
        filled_data.append(int(last_value) if last_value is not None else 0)

    return filled_data


@router.get("/get-stacked-bar-data-for-cluster/{cluster_id}")
async def get_stacked_bar_data_for_cluster(cluster_id: int, db: Session = Depends(get_db)):
    # 📌 MarketCluster abrufen
    market_cluster = db.query(MarketCluster).filter(
        MarketCluster.id == cluster_id).first()
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
        # ✅ Fix angewendet
        start_date = max(cutoff_date.date(), changes[0].change_date.date())

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
            change_today = next(
                (c for c in changes if c.change_date.date() == current_date), None)
            if change_today:
                last_value = change_today.total_revenue if change_today.total_revenue else last_value

            # 📌 Werte speichern
            market_data[market.keyword].append(
                {"date": numeric_date, "value": last_value})

            # ⏩ Zum nächsten Tag wechseln
            current_date += timedelta(days=1)

    return {"stackedData": market_data}


@router.get("/get-sparkline-data-for-market-cluster/{cluster_id}", response_model=List[int])
async def get_sparkline_data_for_market_cluster(cluster_id: int, db: Session = Depends(get_db)) -> List[int]:
    """
    Holt die aggregierte Umsatzentwicklung für ein MarketCluster als Liste von Integer-Werten.
    Falls ein Markt mehrere Änderungen an einem Tag hat, wird der späteste Wert genommen.
    Falls kein Wert existiert, wird der vorherige bekannte Wert übernommen.
    """
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
        print("❌ Keine MarketChanges gefunden!")
        return []

    # 📌 Bestimme das früheste Change-Date pro Markt (innerhalb von 30 Tagen)
    earliest_change_dates = {}
    market_change_map = defaultdict(lambda: defaultdict(list))  # {market_id: {date: [entries]}}

    for mc in market_changes:
        date = mc.change_date.replace(tzinfo=timezone.utc).date()
        market_change_map[mc.market_id][date].append(mc)

    # 📌 Finde das späteste `total_revenue` pro Tag & Markt
    latest_market_values_per_day = defaultdict(dict)

    for market_id, date_entries in market_change_map.items():
        for date, entries in date_entries.items():
            latest_entry = max(entries, key=lambda x: x.change_date)  # ⏳ Spätester Eintrag pro Tag
            if latest_entry.total_revenue is not None:
                latest_market_values_per_day[market_id][date] = latest_entry.total_revenue

    # 📌 Das späteste dieser frühesten Change-Dates bestimmen
    earliest_common_date = max(
        (min(dates) for dates in latest_market_values_per_day.values() if dates),
        default=cutoff_date.date()
    )
    print("🗓️ Earliest common date:", earliest_common_date)

    # 📌 Heute als Enddatum setzen
    today = datetime.now(timezone.utc).date()

    # 📌 Letzte bekannte Werte für jeden Markt initialisieren
    last_market_values = {market.id: 0 for market in markets}

    print("🔄 Initial last market values:", last_market_values)

    # 📌 Sparkline-Data initialisieren
    sparkline_data = []

    # 📌 Iteration über die Zeitreihe
    current_date = earliest_common_date
    while current_date <= today:
        total_revenue = 0  # Tagesumsatz für das gesamte Cluster

        for market in markets:
            if current_date in latest_market_values_per_day[market.id]:
                last_market_values[market.id] = latest_market_values_per_day[market.id][current_date]
                print(f"✅ Markt {market.id} - Letzter Wert für {current_date}: {last_market_values[market.id]}")
            else:
                print(f"⚠️ Markt {market.id} - Keine Änderung für {current_date}, behalte letzten Wert: {last_market_values[market.id]}")

            # Summe für das Cluster
            total_revenue += last_market_values[market.id]

        # 📌 Speichere den Wert in der Sparkline-Liste
        sparkline_data.append(int(total_revenue))
        print(f"📊 Sparkline [{current_date}]: {total_revenue}")

        # ⏩ Zum nächsten Tag wechseln
        current_date += timedelta(days=1)

    if len(sparkline_data) == 1:
        sparkline_data.append(sparkline_data[0])
    print("📈 Final Sparkline Data:", sparkline_data)
    return sparkline_data  # 🔥 KEINE ZEITACHSE – nur die Liste mit Werten


@router.get("/get-bar-chart-data")
async def get_bar_chart_data():
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
