# Unraid: Questarr More aus dem Git-Projekt

Zwei einfache Wege, auf Unraid einen Container aus **diesem Repository** zu betreiben.

## Voraussetzungen

- Unraid mit **Docker** aktiviert.
- **Git** auf dem Server (z. B. über _Nerd Tools_ / Terminal) oder Repo per SMB auf die Share kopieren und Pfade anpassen.
- Empfohlener Klon-Pfad: z. B. `/mnt/user/docker/questarr-more` (nur Quellcode; App-Daten liegen getrennt unter `appdata`).

---

## Variante A — Docker Compose (empfohlen, ein Befehl)

1. Repo klonen:

   ```bash
   cd /mnt/user/docker
   git clone https://github.com/DEIN_USER/Questarr-More.git questarr-more
   cd questarr-more
   ```

   (`DEIN_USER/Questarr-More` durch dein echtes Repository ersetzen.)

2. Container bauen und starten:

   ```bash
   docker compose -f docker-compose.unraid.yml up -d --build
   ```

3. Web-UI: `http://<UNRAID-IP>:5000`

**Optional — Pfade/Ports per Umgebung:**

```bash
export QUESTARR_MORE_DATA=/mnt/user/appdata/questarr-more
export QUESTARR_MORE_HTTP_PORT=5000
export QUESTARR_MORE_SSL_PORT=9898
export PUID=1000
export PGID=1000
docker compose -f docker-compose.unraid.yml up -d --build
```

**Update nach `git pull`:**

```bash
cd /mnt/user/docker/questarr-more
git pull
docker compose -f docker-compose.unraid.yml build --no-cache
docker compose -f docker-compose.unraid.yml up -d
```

---

## Variante B — Unraid-Template (Docker-UI)

Die Datei **`unraid/questarr-more.xml`** ist ein **Community-Template-kompatibles** XML für _Apps → Docker → Add Container_.

### Schritt 1: Image lokal bauen

Im geklonten Projekt auf dem Unraid-Terminal:

```bash
cd /mnt/user/docker/questarr-more
docker build -t questarr-more:local .
```

Ohne diesen Schritt existiert das Tag `questarr-more:local` nicht — Unraid würde sonst versuchen, ein Image von einer Registry zu ziehen.

### Schritt 2: Template einbinden

1. Docker → **Add Container**
2. Oben **Template** → **User templates** / „Select a template“ → ggf. **New template** aus **XML** oder Datei aus dem Share laden.
3. Alternativ: XML nach `/boot/config/plugins/dockerMan/templates-user/` kopieren und in der Docker-UI auswählen (je nach Unraid-Version leicht unterschiedlich).
4. Wichtig: Im Template ist **`--pull=never`** gesetzt, damit **nur** dein lokales Image `questarr-more:local` verwendet wird.

### Schritt 3: Pfade prüfen

- **Daten-Pfad** (Standard): `/mnt/user/appdata/questarr-more`
- **PUID/PGID** an deine Shares anpassen (häufig `1000`/`1000` oder Unraid-Standard `99`/`100` — dann müssen Ordnerrechte passen).

### Template aus dem Git (Raw-URL)

Wenn das Repo öffentlich auf GitHub liegt, kannst du in der Docker-UI eine Template-URL eintragen, z. B.:

`https://raw.githubusercontent.com/DEIN_USER/Questarr-More/main/unraid/questarr-more.xml`

Danach `TemplateURL` in der XML-Datei lokal auf dieselbe URL setzen, wenn du „Update template“ in der UI nutzen willst.

---

## Hinweise

- **SSL**: Port `9898` ist wie beim upstream Questarr vorgesehen; HTTP bleibt Standard `5000`.
- **Stable Image ohne Build**: Wer das offizielle Questarr-Image nutzen will, verwendet das bestehende Template `unraid/questarr.xml` (GHCR `ghcr.io/doezer/questarr`). **Questarr More** aus Git ist bewusst als **`questarr-more:local`** umgesetzt.
- Bei Problemen: Docker-Log des Containers prüfen; Build-Logs mit `docker compose -f docker-compose.unraid.yml build` erneut ansehen.
