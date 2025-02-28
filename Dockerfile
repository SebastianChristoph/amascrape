# Basis-Image mit Python 3.9
FROM python:3.9

# Setze das Arbeitsverzeichnis im Container
WORKDIR /app

# Kopiere die requirements.txt und installiere Abhängigkeiten
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopiere den Rest des Anwendungs-Codes
COPY . .

# Exponiere Port 5000
EXPOSE 5000

# Setze die Umgebungsvariablen für Flask
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_ENV=production

# Starte die Flask-App
CMD ["flask", "run"]
