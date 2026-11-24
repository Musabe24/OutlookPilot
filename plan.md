# OutlookPilot – Umsetzungsplan für den lokalen MCP-Server

**Ziel:** Ein Nutzer kann seinen lokalen Agenten bitten, eine Outlook-Mail zu finden, eine Antwort zu entwerfen, sie nach Prüfung zu versenden und ausgewählte Nachrichten ins Archiv, in einen eigenen Ordner oder nach „Gelöschte Elemente“ zu verschieben. Grundlage ist der Architekturentwurf für TypeScript, MCP über stdio, MSAL Node, Microsoft Graph und SQLite.

**Arbeitsweise:** Wir beginnen bei Schritt 1. Ein Schritt ist erledigt, wenn die angegebene Abnahme gelingt. Beim Abhaken ergänzen wir Datum, getestete Version und Ergebnis. Für eine ausstehende Live-Prüfung vermerken wir konkret, welches Konto, welche Berechtigung oder welches Gerät fehlt. Unabhängige Arbeiten mit simuliertem Graph können währenddessen weitergehen.

- [ ] **1. Zielumgebung und Testpostfach vorbereiten**

  Zielbetriebssystem, lokalen MCP-Client und geschützten Schlüsselspeicher festhalten. Prüfen, welche Shell- und Dateirechte der Agent besitzt. Die spätere Nutzerfreigabe braucht ein unabhängig bedienbares Terminal. Ein Agent mit freiem Zugriff auf CLI und Profildaten könnte diese Grenze umgehen.

  Eine öffentliche Desktop-App bei Microsoft für persönliche Microsoft-Konten und Geschäfts-/Schulkonten registrieren. Loopback-Redirect und mögliche Zustimmungspflicht des Testmandanten klären. Ein separates Testpostfach mit Unterordner, einer beantwortbaren Nachricht, drei unterscheidbaren Newsletter-Testmails und einem kontrollierten Testempfänger vorbereiten.

  **Abnahme:** App-ID, Redirect, erster Zielclient und Kontoart sind bekannt. Die Testnachrichten sind in Outlook erkennbar. Testdaten und Zugangsdaten bleiben außerhalb des Repositorys.

- [ ] **2. Den Server aus einem echten MCP-Client starten**

  TypeScript-Projekt mit festgelegter Node.js-LTS-Version, Lockdatei, Build, Typprüfung und Testrunner anlegen. Der CLI-Einstieg `outlookpilot serve` startet den MCP-Server über stdio. Werkzeugdefinitionen, Postfachaktionen und Graph-Adapter getrennt halten, damit Fehler ohne echtes Postfach simulierbar sind.

  **Abnahme:** Ein frischer Checkout lässt sich anhand dokumentierter Befehle bauen. Ein Prozess-Test und der gewählte Client können den gebauten Server starten, MCP initialisieren und die Werkzeugliste abrufen. Auf stdout erscheinen ausschließlich Protokollnachrichten.

- [ ] **3. Anmeldung und Kontobindung mit Microsoft nachweisen**

  `outlookpilot login` öffnet den Systembrowser und verwendet MSAL mit PKCE. Zunächst delegiertes `Mail.Read` anfordern. Profil an Konto und Mandanten binden. CLI und Server verwenden denselben geschützten Token-Cache. Fehler für fehlenden Schlüsselspeicher, verweigerte Zustimmung und erforderliche Neuanmeldung unterscheidbar machen.

  **Abnahme:** Nach interaktiver Anmeldung kann der separat gestartete Server den Posteingangsordner über Graph unter `/me` abrufen. Nach einem Neustart gelingt der Abruf ohne erneuten Login, nach `logout` wird eine Anmeldung verlangt. Tokens erscheinen weder in MCP-Antworten noch in Diagnosen. Vor dem Ausbau der Schreibfunktionen müssen Konto und Berechtigungsmodell am echten Dienst funktionieren.

- [ ] **4. Einen vollständigen Leseablauf liefern**

  `list_folders`, `search_mail` und `read_mail` implementieren. Unterstützte Suchfilter benennen. Standardmäßig 25 Ergebnisse je Seite liefern und Cursor an Konto und Abfrage binden. Unveränderliche Graph-IDs anfordern. Die Suche liefert Vorschauen, das Lesen größenbegrenzten Klartext mit Kürzungshinweis. HTML wird als Text behandelt. Eingebettete Ressourcen werden nicht geladen.

  **Abnahme:** Der echte Client findet den Unterordner, blättert mit kleiner Seitengröße durch zwei Ergebnisseiten und liest die richtige Testmail. Ordner und Lesestatus bleiben erhalten. Automatisiert ungültige Cursor, fehlende Nachrichten und begrenzte Wiederholungen bei `429` mit `Retry-After` prüfen. Eine im Mailtext enthaltene Anweisung kann keine Freigabe erzeugen.

- [ ] **5. Neue Nachrichten und Antworten als Entwurf speichern**

  Beim Aktivieren des Schreibens delegiertes `Mail.ReadWrite` anfordern. `create_draft` erstellt neue Entwürfe, `reply_draft` verwendet Graphs `createReply` für Antworten im selben Gespräch. Beide Werkzeuge geben die Entwurfs-ID zurück. Nach einem Verbindungsabbruch mit unklarem Ergebnis darf ein Schreibaufruf nicht automatisch einen zweiten Entwurf erzeugen.

  **Abnahme:** In Outlook sind ein neuer Entwurf und eine Antwort im richtigen Gespräch sichtbar und bearbeitbar. Text und Empfänger stimmen. Der gesamte Ablauf funktioniert ohne `Mail.Send`.

- [ ] **6. Freigaben und Vorgangszustand implementieren**

  SQLite speichert Konto, Aktion, IDs, Versionen, Ablaufzeit und Einzelergebnis. Die lokale CLI `outlookpilot review <plan-id>` zeigt die konkret betroffene Aktion und nimmt Bestätigung oder Ablehnung entgegen. MCP bietet `get_operation` zur Statusabfrage. Die Freigabe bleibt im Nutzerterminal. Freigabe und Übernahme zur Ausführung jeweils atomar speichern. Konto, Ablaufzeit und Zustand bei Übernahme erneut prüfen. Logout entwertet offene Freigaben.

  **Abnahme:** Mit Testuhr, zwei Prozessen und temporärer Datenbank nachweisen, dass ein abgelehnter, nach 15 Minuten abgelaufener oder kontofremder Plan keine Ausführung startet. Eine gültige Freigabe überlebt einen Neustart. Zwei gleichzeitige Aufrufe erzeugen genau einen Ausführungsversuch.

- [ ] **7. Einen geprüften Entwurf versenden**

  `plan_send` auf Textentwürfe ohne Anlagen begrenzen. Die CLI zeigt das sendende Konto, An/CC/BCC, Betreff und vollständigen Text. Freigabe an Entwurfs-ID, Version und Fingerabdruck der geprüften Inhalte binden. `Mail.Send` erst beim Aktivieren des Agentenversands anfordern. `send_draft` prüft den Entwurf unmittelbar vor dem Versand erneut und speichert den Versuch vor dem Graph-Aufruf.

  **Abnahme:** Eine nach Freigabe geänderte Empfängeradresse entwertet den Plan. Ein neu geprüfter Entwurf erreicht den kontrollierten Testempfänger. Graphs `202 Accepted` erscheint als „zum Versand angenommen“. Beim simulierten Timeout nach Übergabe an Graph bleibt der Status „Ausgang unklar“. Auch nach Neustart erfolgt kein zweiter Versand. Das Zeitfenster für manuelle Änderungen zwischen letzter Prüfung und Versand in der Anleitung benennen.

- [ ] **8. Ausgewählte Nachrichten sortieren und bereinigen**

  `plan_cleanup` übernimmt konkrete IDs und einen bestehenden Zielordner, entfernt Duplikate und weist mehr als 100 verschiedene Nachrichten zurück. Ursprungsordner und Version je Nachricht festhalten. Die CLI zeigt Konto, Ziel, Anzahl und die vollständige einsehbare Liste. `apply_cleanup` prüft jede Position erneut und verschiebt sie einzeln. Geänderte oder fehlende Nachrichten erhalten ein eigenes Ergebnis.

  **Abnahme:** Drei Testmails zum Archivieren vorschlagen. Eine vor Ausführung manuell verschieben und eine vierte neu zustellen. Genau die zwei unveränderten Treffer landen im Archiv. Der dritte wird als Konflikt gemeldet, der vierte bleibt im Posteingang. Zusätzlich je eine Testmail in einen eigenen Ordner und nach „Gelöschte Elemente“ verschieben. Eine Verschiebung mit den gespeicherten Ursprungsdaten und einer neuen Freigabe rückgängig machen.

- [ ] **9. Wiederanlauf und lokale Datenspuren prüfen**

  Einen Prozessabbruch zwischen erfolgreicher Graph-Verschiebung und lokaler Ergebnisspeicherung simulieren. Den begonnenen Versuch beim Neustart über unveränderliche ID und aktuellen Ordner abgleichen. Bereits erreichte Ziele verbuchen, widersprüchliche Zustände zur Prüfung vorlegen und übrige Positionen nachvollziehbar abschließen. Die Löschung abgeschlossener Vorgänge nach 30 Tagen sowie die Zugriffsrechte auf das Profil umsetzen.

  **Abnahme:** Nach dem Abbruch stimmen Postfachzustand und Einzelstatus überein. Ein erneuter Aufruf verarbeitet erledigte Positionen nicht noch einmal. Ein Test mit vorgestellter Uhr entfernt alte Verlaufsdaten. Markierte Testwerte für Mailtext, Betreff, Adressen und Tokens sind in Diagnoseausgaben und SQLite nicht auffindbar.

- [ ] **10. Den MVP aus einem frischen Profil abnehmen**

  Kurzanleitung für Installation, Microsoft-Registrierung, Login, Client-Konfiguration, Terminalfreigabe, Statusprüfung und Logout fertigstellen. Erklären, dass der gewählte Agentenclient gelesene Inhalte an sein Cloud-Modell übertragen kann. Die automatisierten Fehlerfalltests ohne Microsoft-Zugang reproduzierbar ausführen.

  **Abnahme:** Auf einem frischen Profil nur anhand der Anleitung drei Aufträge ausführen: „Finde und lies diese Mail“, „Antworte und versende nach Prüfung“ und „Räume diese Newsletter auf“. Die Kernabläufe für Outlook.com und Microsoft 365 mit echten Testkonten prüfen. Je Kontoart Betriebssystem, Client-Version, erwartetes und tatsächliches Ergebnis festhalten. Eine ungeprüfte Kombination bleibt offen.

**Fertig ist der MVP**, wenn die Nutzerabläufe im echten MCP-Client funktionieren, die Freigabe- und Wiederanlauftests bestehen und für jede als unterstützt ausgewiesene Kontoart ein erfolgreiches Abnahmeprotokoll vorliegt.
