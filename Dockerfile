# Basis-Image mit Python
FROM python:3.9

# Setze das Arbeitsverzeichnis im Container
WORKDIR /app

# Kopiere alle Dateien ins Arbeitsverzeichnis
COPY . .

# Installiere Abhängigkeiten (falls eine requirements.txt existiert)
RUN pip install --no-cache-dir -r requirements.txt || true

# Setze die Umgebungsvariable für Flask
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_ENV=production

# Exponiere den Port für Flask (Standard: 5000)
EXPOSE 5000

# Starte die Flask-App
CMD ["python", "app.py"]
