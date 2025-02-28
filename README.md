# Amascraper

## Start-Anleitung

- Docker Desktop starten
- in das Terminal gehen und zum Projekt navigieren 
- dort ausführen:
-  `git pull`
- nur ausführen, wenn es bei `git pull`Änderungen gab: `docker build -t amascrape .`
- immer ausführen: `docker run -d -p 5000:5000 amascrape`

WebApp danach aufrufbar unter:
`http://localhost:5000/`
