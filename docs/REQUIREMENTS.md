# Busap - Wymagania biznesowe i polecenia rozwojowe

## Spis polecen uzytkownika

### Sesja 2026-02-04

**Polecenie 1: ETA Engine + kolejne kroki**
> Kontynuuj od ETA Engine, a potem wykonuj kroki po kolei bez pytania o zgode.

**Polecenie 2: Panel admina/superusera**
> Dodaj panel dla superusera i admina - nowa rola (admin) o podobnych uprawnieniach jak superuser, ale bez mozliwosci usuniecia konta superusera. Panel powinien umozliwiac:
> - Dodawanie uzytkownikow recznie i poprzez wysylanie zaproszen na email (unikalny link)
> - Zarzadzanie uzytkownikami i firmami
> - Zarzadzanie trasami, przystankami i wszystkimi zasobami

**Polecenie 3: Mapy OSM**
> Aplikacja powinna uzywac map OSM (OpenStreetMap + Leaflet)

**Polecenie 4: Symulator pojazdu**
> Potrzebny symulator pojazdu do testowania sledzenia przejazdu autobusu na wybranych kursach

**Polecenie 5: Dokumentacja i plany**
> Zapisuj plany dzialania do plikow i aktualizuj status realizacji. Plany maja sluzyc jako pomoc do pisania dokumentacji projektu i zarys wymagan biznesowych.

---

## Wymagania biznesowe

### 1. System rol uzytkownikow

| Rola | Opis | Uprawnienia |
|------|------|-------------|
| passenger | Pasazer | Wyszukiwanie kursow, podglad ETA, mapa |
| driver | Kierowca | Przypisane kursy, raportowanie GPS, odliczanie |
| manager | Manager firmy | CRUD: przystanki, trasy, kursy, pojazdy, ceny, raporty |
| owner | Wlasciciel firmy | Jak manager + przypisywanie rol, zatwierdzanie zmian |
| admin | Administrator systemu | Pelny dostep do panelu zarzadzania, bez mozliwosci usuwania kont superadmin |
| superadmin | Super administrator | Pelny dostep do systemu, najwyzsze uprawnienia |

### 2. Panel administracyjny (admin + superadmin)

**Zarzadzanie uzytkownikami:**
- Lista uzytkownikow z filtrowaniem i wyszukiwaniem
- Tworzenie uzytkownikow recznie (formularz)
- Zaproszenia email z unikalnym linkiem rejestracyjnym
- Edycja profili uzytkownikow
- Dezaktywacja/aktywacja kont
- Przypisywanie rol do firm
- Superadmin: moze usuwac konta admin, admin nie moze usuwac kont superadmin

**Zarzadzanie firmami:**
- CRUD firm
- Podglad statystyk firmy (pojazdy, trasy, kierowcy, aktywne kursy)
- Przypisywanie uzytkownikow do firm

**Zarzadzanie trasami i przystankami:**
- CRUD przystankow z geolokalizacja
- CRUD tras z wersjonowaniem
- Wizualizacja trasy na mapie OSM
- Wyjatki trasowe (tymczasowe, stale)

**Zarzadzanie pojazdami i kursami:**
- CRUD pojazdow
- CRUD kursow z przypisaniem kierowcy i pojazdu
- Podglad statusu kursow

**Zarzadzanie cenami:**
- Konfiguracja cennikow (flat, per_segment)
- Podglad aktywnych cennikow

### 3. Panel firmy (manager + owner)

**Zarzadzanie pojazdami:**
- CRUD pojazdow z upload zdjec
- Filtrowanie i wyszukiwanie

**Zarzadzanie trasami:**
- CRUD tras
- Przypisywanie przystankow

**Zarzadzanie kursami:**
- CRUD kursow
- Przypisywanie pojazdow i kierowcow

**Zarzadzanie przystankami:**
- Dodawanie przystankow
- Edycja przystankow (tylko te nalezace do firmy)
- Widok listy i mapy
- Wyszukiwanie przystankow

**Zarzadzanie pracownikami:**
- Dodawanie czlonkow firmy
- Zmiana rol w firmie
- Usuwanie czlonkow

### 4. Integracja map OSM

- Wyswietlanie pozycji autobusow na mapie w czasie rzeczywistym
- Wizualizacja tras (polyline z przystankami)
- Markery przystankow z informacjami
- Wyszukiwanie przystankow na mapie
- Sledzenie pojazdu na kursie (tracking view)

### 5. Symulator pojazdu

- Symulacja ruchu autobusu wzdluz wybranej trasy
- Konfigurowalny: predkosc, kurs, opoznienia
- Raportowanie pozycji GPS przez API
- Interfejs webowy do kontroli symulacji
- Przydatny do testowania i demonstracji

### 6. ETA Engine (istniejacy - do rozbudowy)

- Kalkulacja na podstawie rozkladu jazdy
- Korekta GPS (real-time)
- Korekta historyczna (srednie opoznienia)
- Cache w Redis (30s TTL)
- Przygotowanie pod Traffic API (przyszlosc)
