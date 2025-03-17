# Amascraper

## 🚀 Start-Anleitung

### 1️⃣ Projekt klonen & aktualisieren
Falls das Projekt noch nicht geklont wurde:
```sh
git clone <REPOSITORY_URL>
cd Amascraper
```
Falls das Projekt bereits existiert:
```sh
zum Projekt-Pfad navigieren, dort:
git pull
```

### 2️⃣ Docker-Container starten
```sh
docker-compose up --build
```
💡 **Nur notwendig, wenn sich der Code geändert hat.** Falls kein Code-Update vorliegt, genügt:
```sh
docker-compose up
```

Nach dem Start ist die WebApp erreichbar unter:  
👉 `http://localhost:5173/`

---

## 🛠️ Troubleshooting

### ❌ **Problem: Docker-Fehlermeldungen oder unerwartetes Verhalten**
Wenn Docker-Container nicht richtig starten oder `docker-compose up` Fehler wirft, könnte es an alten, fehlerhaften oder inkonsistenten Images liegen.  
Lösung:
```sh
docker system prune -a
```
👉 **Achtung:** Dadurch werden **alle** ungenutzten Docker-Images gelöscht! Falls du andere Docker-Projekte hast, musst du sie später neu bauen.

Falls der Fehler weiterhin besteht, kann ein vollständiger Reset helfen:
```sh
docker-compose down
docker system prune -a
docker-compose up --build
```

---

## 🛑 Beenden des Projekts
Falls du das Projekt beenden möchtest, solltest du die laufenden Docker-Container sauber herunterfahren:
```sh
docker-compose down
```
💡 Dadurch werden alle zugehörigen Container gestoppt und entfernt, aber die Images bleiben erhalten.

Falls du alles vollständig löschen möchtest:
```sh
docker-compose down -v
docker system prune -a
```
👉 **Achtung:** Mit `-v` werden auch Volumes gelöscht, was Datenverlust bedeuten kann!

---

## 📚 Nützliche Docker-Kommandos für Anfänger

| Befehl                         | Beschreibung |
|--------------------------------|-------------|
| `docker ps`                    | Zeigt alle laufenden Container an |
| `docker ps -a`                  | Zeigt **alle** Container an, auch gestoppte |
| `docker images`                 | Listet alle heruntergeladenen Docker-Images auf |
| `docker volume ls`              | Listet alle Docker-Volumes auf |
| `docker logs <container_id>`     | Zeigt Logs eines laufenden Containers |
| `docker-compose restart`        | Startet die Container neu |
| `docker-compose down -v`        | Stoppt Container und löscht **auch** Volumes |

---

## 💡 Tipps für Anfänger

- Falls du **nicht sicher bist, ob Docker läuft**, überprüfe es mit:
  ```sh
  docker info
  ```
  Falls Docker nicht läuft, starte es und versuche es erneut.

- Falls Ports blockiert sind (z. B. `localhost:5173`), prüfe mit:
  ```sh
  lsof -i :5173
  ```
  Falls ein alter Prozess den Port belegt, kannst du ihn beenden:
  ```sh
  kill -9 <PID>
  ```

- Falls du **die neuesten Logs eines Containers sehen möchtest**, nutze:
  ```sh
  docker-compose logs -f
  ```
  Das hilft beim Debuggen von Fehlern!

---

✅ **Jetzt bist du bereit, mit Amascraper loszulegen! 🚀**
