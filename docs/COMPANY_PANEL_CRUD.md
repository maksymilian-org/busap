# Panel firmy - Pełny CRUD

Data implementacji: 2026-02-10

## Cel

Dodanie pełnej funkcjonalności CRUD (Create, Read, Update, Delete) w panelu firmy dla:
- Pojazdów (z file upload)
- Tras
- Kursów
- Przystanków (nowa sekcja)

## Problem

W panelu firmy (company panel) dla managerów i ownerów brakło możliwości edycji i usuwania zasobów. Sekcje Pojazdy, Trasy i Kursy miały tylko możliwość dodawania nowych elementów. Dodatkowo:
- Modal dodawania pojazdu używał pola URL zamiast file upload
- Brakowało całkowicie sekcji Przystanków

## Rozwiązanie

Zaimplementowano pełny CRUD we wszystkich sekcjach panelu firmy, wzorując się na panelu administracyjnym, który już posiadał te funkcjonalności.

## Zmiany w kodzie

### 1. Vehicles - Edit, Delete, File Upload

**Plik:** `apps/web/src/app/[locale]/(company)/company/[companyId]/vehicles/page.tsx`

**Dodane funkcjonalności:**
- State `editingVehicle` - przechowuje pojazd w trakcie edycji
- `handleDelete(id)` - usuwa pojazd po potwierdzeniu przez użytkownika
- `handlePhotoUpload(file)` - upload zdjęcia przez API `/storage/upload/vehicle-photo`
- Przyciski Edit i Delete w kartach pojazdów
- VehicleFormModal obsługuje tryb edit (isEdit)

**Zmienione:**
- Pole photoUrl zmienione z `<input type="url">` na file upload z preview
- Modal wyświetla odpowiedni tytuł i przyciski w zależności od trybu (create/edit)
- Dodano konwersję pomiędzy trybami create i edit

**API endpoints wykorzystane:**
```
PUT /vehicles/{id}     - edycja pojazdu
DELETE /vehicles/{id}  - usunięcie pojazdu
POST /storage/upload/vehicle-photo - upload zdjęcia
```

### 2. Routes - Edit, Delete

**Plik:** `apps/web/src/app/[locale]/(company)/company/[companyId]/routes/page.tsx`

**Dodane funkcjonalności:**
- State `editingRoute`
- `handleDelete(id)` - usunięcie trasy
- Przyciski Edit i Delete
- RouteFormModal obsługuje tryb edit

**API endpoints wykorzystane:**
```
PUT /routes/{id}    - edycja trasy
DELETE /routes/{id} - usunięcie trasy
```

### 3. Trips - Edit, Delete

**Plik:** `apps/web/src/app/[locale]/(company)/company/[companyId]/trips/page.tsx`

**Dodane funkcjonalności:**
- State `editingTrip`
- `handleDelete(id)` - usunięcie kursu
- Przyciski Edit i Delete
- TripFormModal obsługuje tryb edit z konwersją dat

**Specjalne uwagi:**
- Konwersja dat ISO → datetime-local format przy edycji:
  ```typescript
  scheduledDepartureTime: trip?.scheduledDepartureTime
    ? new Date(trip.scheduledDepartureTime).toISOString().slice(0, 16)
    : ''
  ```

**API endpoints wykorzystane:**
```
PUT /trips/{id}    - edycja kursu
DELETE /trips/{id} - usunięcie kursu
```

### 4. Stops - Nowa sekcja

**Nowy plik:** `apps/web/src/app/[locale]/(company)/company/[companyId]/stops/page.tsx`

**Funkcje:**
- Lista przystanków z filtrowaniem po companyId
- Widok mapy (OpenStreetMap + Leaflet) i lista (toggle)
- Dodawanie przystanków
- Edycja przystanków
- **Brak DELETE** - przystanki mogą być współdzielone między firmami

**Kluczowe dostosowania względem panelu admina:**
- Namespace tłumaczeń: `company.stops` zamiast `admin.stops`
- API calls: dodano `?companyId=${companyId}` do wszystkich zapytań
- Sprawdzenie uprawnień: `isManagerOf(companyId)`
- Zachowano widok mapy i listę

**API endpoints wykorzystane:**
```
GET /stops?companyId={id}&query=...&limit=100 - lista
POST /stops                                    - dodanie
PUT /stops/{id}                                - edycja
```

## Tłumaczenia

### Dodane klucze (PL i EN)

**Wspólne dla wszystkich sekcji:**
- `confirmDelete` - tekst potwierdzenia usunięcia
- `deleted` - komunikat sukcesu po usunięciu
- `editModal.title` - tytuł modalu edycji
- `editModal.submit` - tekst przycisku zapisu
- `editModal.submitting` - tekst podczas zapisywania
- `editModal.success` - komunikat sukcesu

**Dla vehicles dodatkowo:**
- `createModal.photo` - etykieta pola zdjęcia
- `createModal.selectPhoto` - tekst przycisku wyboru pliku
- `createModal.uploading` - tekst podczas uploadu
- `createModal.uploadSuccess` - komunikat sukcesu uploadu
- `createModal.uploadError` - komunikat błędu uploadu

**Nowa sekcja stops:**
Pełny zestaw tłumaczeń dla title, subtitle, table headers, status badges, create/edit modals.

**Nawigacja:**
- `nav.stops` - "Przystanki" / "Stops"

## Nawigacja

**Plik:** `apps/web/src/app/[locale]/(company)/layout.tsx`

Dodano link do Przystanków w menu bocznym panelu firmy:
```typescript
{
  name: t('nav.stops'),
  href: `/company/${currentCompanyId}/stops`,
  icon: MapPin,
}
```

## API Endpoints

Wszystkie endpointy już działają, wykorzystywane są te same co w panelu administracyjnym:

**Vehicles:**
- `GET /vehicles?companyId={id}` - lista
- `POST /vehicles` - create
- `PUT /vehicles/{id}` - update
- `DELETE /vehicles/{id}` - delete
- `POST /storage/upload/vehicle-photo` - upload zdjęcia

**Routes:**
- `GET /routes?companyId={id}` - lista
- `POST /routes` - create
- `PUT /routes/{id}` - update
- `DELETE /routes/{id}` - delete

**Trips:**
- `GET /trips?companyId={id}` - lista
- `POST /trips` - create
- `PUT /trips/{id}` - update
- `DELETE /trips/{id}` - delete

**Stops:**
- `GET /stops?companyId={id}&query=...&limit=100` - lista
- `POST /stops` - create
- `PUT /stops/{id}` - update

## Bezpieczeństwo

- Wszystkie operacje wymagają autoryzacji: `isManagerOf(companyId)`
- API sprawdza czy użytkownik ma uprawnienia do danej firmy
- Przystanki: tylko edycja, brak delete (są współdzielone między firmami)
- File upload: tylko obrazy (image/*), max 5MB

## Wzorce implementacji

**CRUD Pattern:**
Każda sekcja używa standardowego wzorca:
1. State `editingItem` do przechowywania edytowanego elementu
2. Funkcja `handleDelete(id)` z potwierdzeniem przez `confirm()`
3. Modal komponent z parametrem `item?: ItemData`
4. Logika `isEdit = !!item` → `if (isEdit) { PUT } else { POST }`
5. Przyciski Edit i Delete w listingu

**Modale:**
- Shared struktura: header z tytułem i przyciskiem X, form, footer z przyciskami
- Dynamiczny tytuł i przyciski w zależności od trybu
- Error handling z toast notifications
- Conditional rendering: `{(showCreateModal || editingItem) && <Modal />}`

**Toast notifications:**
- Success: `toast({ variant: 'success', title: '...' })`
- Error: `toast({ variant: 'destructive', title: '...', description: err.message })`

## Weryfikacja

Po implementacji należy przetestować:

1. **Vehicles:**
   - ✓ Kliknięcie Edit → modal z wypełnionymi danymi
   - ✓ Zmiana danych i zapis → toast success + odświeżenie listy
   - ✓ Upload nowego zdjęcia → preview + zapis
   - ✓ Kliknięcie Delete → potwierdzenie → usunięcie + toast success

2. **Routes:**
   - ✓ Edit trasy → zmiana nazwy/kodu → zapis
   - ✓ Delete trasy → potwierdzenie → usunięcie

3. **Trips:**
   - ✓ Edit kursu → zmiana dat/pojazdu/kierowcy → zapis
   - ✓ Sprawdzenie formatu dat (czy poprawnie konwertowane)
   - ✓ Delete kursu → potwierdzenie → usunięcie

4. **Stops (nowa sekcja):**
   - ✓ Dostęp do `/company/{id}/stops`
   - ✓ Wyświetlenie listy przystanków (z filtrowaniem po companyId)
   - ✓ Toggle List/Map view
   - ✓ Dodanie nowego przystanku
   - ✓ Edycja przystanku
   - ✓ Search po nazwie/mieście

5. **Dokumentacja:**
   - ✓ Sprawdzenie czy wszystkie 3 pliki w /docs zostały zaktualizowane

## Pliki zmodyfikowane

### Frontend (Next.js):
- `apps/web/src/app/[locale]/(company)/company/[companyId]/vehicles/page.tsx` - dodano CRUD + file upload
- `apps/web/src/app/[locale]/(company)/company/[companyId]/routes/page.tsx` - dodano CRUD
- `apps/web/src/app/[locale]/(company)/company/[companyId]/trips/page.tsx` - dodano CRUD
- `apps/web/src/app/[locale]/(company)/company/[companyId]/stops/page.tsx` - **NOWY PLIK**
- `apps/web/src/app/[locale]/(company)/layout.tsx` - dodano link do stops
- `apps/web/messages/pl/company.json` - dodano tłumaczenia
- `apps/web/messages/en/company.json` - dodano tłumaczenia

### Dokumentacja:
- `docs/DEVELOPMENT_STATUS.md` - zaktualizowano status funkcjonalności
- `docs/REQUIREMENTS.md` - dodano sekcję Panel firmy
- `docs/COMPANY_PANEL_CRUD.md` - **NOWY PLIK** (ten dokument)

### Backend (NestJS):
Brak zmian - wszystkie endpointy API już działały.

## Wzór implementacji

Implementacja była oparta na istniejącym panelu administracyjnym:
- **Źródło:** `apps/web/src/app/[locale]/(admin)/admin/*/page.tsx`
- **Cel:** `apps/web/src/app/[locale]/(company)/company/[companyId]/*/page.tsx`

Główne różnice:
1. Filtrowanie po `companyId` zamiast pokazywania wszystkich zasobów
2. Sprawdzanie uprawnień przez `isManagerOf(companyId)`
3. Namespace tłumaczeń `company.*` zamiast `admin.*`
4. Brak DELETE dla przystanków (są współdzielone)

## Korzyści

1. **Spójność UI/UX** - panel firmy ma teraz taką samą funkcjonalność jak panel admina
2. **Samostanowienie firm** - managerowie mogą zarządzać swoimi zasobami bez potrzeby kontaktu z adminem
3. **Upload plików** - pojazdy mogą mieć zdjęcia uploadowane bezpośrednio z urządzenia
4. **Kompletność** - wszystkie podstawowe operacje CRUD są dostępne
5. **Mapa przystanków** - wizualna reprezentacja lokalizacji przystanków

## Znane ograniczenia

- Przystanki: brak funkcji DELETE (celowe - przystanki mogą być współdzielone)
- Brak masowego usuwania (delete multiple)
- Brak eksportu danych do CSV/Excel
- Brak filtrowania zaawansowanego (np. po dacie utworzenia)

## Przyszłe usprawnienia (opcjonalne)

1. Masowe operacje (multi-select + batch delete)
2. Sortowanie kolumn w tabelach
3. Paginacja dla dużych list
4. Drag & drop dla uploadu zdjęć
5. Crop/resize zdjęć przed uploadem
6. Historia zmian (audit log) dla każdego zasobu
