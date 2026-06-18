# Blackout — Roadmapa do MVP

> Przegląd gotowości projektu do wypuszczenia MVP. Stan na 2026-06-18.
> Stack: backend (Express 5 + Prisma 5.15 + PostgreSQL), frontend (Expo / React Native), cms (React + Vite), shared types.

## Werdykt

**Jeszcze nie gotowe.** Funkcjonalnie gra jest kompletna (happy path działa end-to-end), ale
blokują ją trzy obszary: **brak autoryzacji**, **konfiguracja środowiska/buildu** oraz
**„cheaty" deweloperskie wciąż obecne w produkcyjnym UI**. To nie kwestia brakujących ekranów —
to kwestia bezpieczeństwa i hardeningu.

Co już działa (zakres MVP domknięty):
- rejestracja / login,
- mapa + lootowanie + cooldowny,
- ekwipunek + craftowanie,
- statystyki survival (HP/głód/pragnienie) + cron,
- respawn, XP/poziomy,
- CMS (items / airdrops / players / config),
- loading / error / empty states w większości miejsc.

---

## 🔴 BLOKERY (bez tego nie wypuszczać)

### 1. Cały panel admina jest całkowicie otwarty
`backend/src/features/admin/admin.routes.ts` nie ma **żadnego** middleware — ani `requireAuth`,
ani autoryzacji admina. CMS (`cms/src/api/client.ts`) wysyła zapytania bez żadnego tokena.
Przy otwartym `cors()` oznacza to, że **ktokolwiek w sieci** może:
- zabić / uleczyć / zmienić poziom dowolnego gracza (`POST /players/:id/kill`),
- przepisać konfigurację gry i tworzyć itemy / airdropy,
- pobrać listę wszystkich graczy **wraz z e-mailami** (`GET /players`).

**Fix:** dodaj rolę admina (kolumna `role`/`isAdmin` w `backend/prisma/schema/auth.prisma`
+ claim w JWT), middleware `requireAdmin`, `router.use(requireAuth, requireAdmin)`, oraz
logowanie + interceptor z nagłówkiem `Authorization` w CMS.

### 2. Sekret JWT jest zahardkodowany i to on realnie działa
`backend/src/middleware/requireAuth.ts:4` i `auth.controller`: `process.env.JWT_SECRET || 'supersecret'`.
Zweryfikowane: `backend/.env` zawiera **tylko `DATABASE_URL`** — czyli tokeny są podpisywane
literałem `'supersecret'` z repo. Każdy może sfałszować token dla dowolnego `userId` i podszyć się
pod gracza na wszystkich chronionych endpointach.

**Fix:** czytaj `JWT_SECRET` raz na starcie, **rzuć błędem gdy brak** (usuń fallback),
ustaw silny sekret w `.env`.

> Punkty 1 + 2 razem = całkowity bypass autoryzacji na obu warstwach. To jest *ten* blocker.

### 3. Aplikacja mobilna nie połączy się z backendem
`frontend/src/utils/api.ts:5` → `http://172.20.10.2:3000/api` — to IP z Personal Hotspota iPhone'a,
po `http`. Nie zadziała na żadnym realnym urządzeniu / w sieci komórkowej / produkcji, a release
build zablokuje to przez iOS ATS / Android cleartext policy. To samo w CMS:
`cms/src/api/client.ts:3` hardkoduje `localhost:3000`.

**Fix:** przenieś na `EXPO_PUBLIC_API_URL` (frontend) i `VITE_API_BASE` (CMS), produkcyjny host po HTTPS.

### 4. Mapa (główny ekran gry) jest zepsuta w realnym buildzie
`frontend/src/features/map/screens/MapScreen.tsx:372` wymusza `provider="google"`, ale
`frontend/app.json` nie ma klucza Google Maps → **szara / pusta mapa na Androidzie**. Dodatkowo brak
deklaracji uprawnień lokalizacji (`NSLocationWhenInUseUsageDescription`, `android.permissions`,
plugin `expo-location`) → **odrzucenie w App Store** i potencjalny crash promptu w release.

**Fix:** dodaj klucze `config.googleMaps*` + plugin `expo-location` z opisem uprawnień w app.json.

### 5. Deweloperskie cheaty w produkcyjnym UI
- `POST /map/locations/spawn` (`backend/src/features/map/map.routes.ts:9`) + pomarańczowy przycisk
  „Spawn Loot" (`frontend/src/features/map/screens/MapScreen.tsx:413`) — każdy gracz spawnuje sobie
  nieskończony loot.
- Wirtualny D-pad pozwala „teleportować się" niezależnie od GPS — podważa cały sens gry lokacyjnej.

**Fix:** schowaj za `__DEV__` / flagą env albo usuń przed releasem.

---

## 🟡 POWINNO BYĆ NAPRAWIONE (zanim wpuścisz realnych userów)

| # | Problem | Plik |
|---|---------|------|
| 6 | **Brak obsługi 401 / wygaśnięcia tokena** — tylko request-interceptor, brak response. Wygasły token zostawia usera „zawieszonego" bez auto-logoutu | `frontend/src/utils/api.ts` |
| 7 | **Brak walidacji inputu** na register/login (crash bcrypt przy braku hasła → generyczne 500); formularze CMS bez walidacji zakresów lat/lng | `backend/src/features/auth/auth.controller.ts`, `cms/src/features/airdrops/components/AirdropForm.tsx` |
| 8 | **Brak globalnego error handlera** + cron bez try/catch → unhandled rejection co minutę może ubić serwer | `backend/src/index.ts`, `backend/src/features/player/player.cron.ts` |
| 9 | **Lootowanie nie jest atomowe** — capacity / cooldown / XP to osobne zapytania bez transakcji → race przy double-tap (przekroczenie plecaka, farmienie XP, 500 przy podwójnym usunięciu airdropu) | `backend/src/features/map/map.controller.ts` |
| 10 | **`createItem` połyka błędy** — toast „sukces" pokazywany bezwarunkowo, brak `catch` w formularzu | `cms/src/features/items/hooks/useItems.ts` |
| 11 | **CMS: brak edit/delete itemów i brak listy airdropów** (tylko create) — literówki są nieodwracalne, airdropów nie da się przejrzeć/usunąć | `cms/src/features/items/hooks/useItems.ts`, `cms/src/features/airdrops/hooks/useAirdrops.ts` |
| 12 | **`setPlayerLevel` zeruje XP** (`xp: 0`) przy każdej zmianie poziomu — prawdopodobnie niezamierzony efekt uboczny | `cms/src/features/players/hooks/usePlayers.ts:50` |
| 13 | Brak `.env.example` (nigdzie), CORS w pełni otwarty, `scanArea` bez rate-limitu i timeoutu na Overpass | root, `backend/src/index.ts:17` |

---

## 🟢 NICE-TO-HAVE (polish / dług techniczny)

- **Wiele instancji `new PrismaClient()`** w każdym kontrolerze → wyczerpanie connection poola przy HMR. Wyeksportuj jeden klient.
- Brak rate-limitingu na `/login` (brute-force) i brak logowania requestów (`morgan`) — będziesz ślepy na 500-ki w prod.
- `BACKPACK_LIMIT = 20` zahardkodowany na froncie, choć plecak rośnie z poziomem → licznik „X / 20" kłamie dla wyższych leveli.
- Recepty craftingu i `consumeItem` (heal `30`) zahardkodowane w kodzie zamiast w DB / configu.
- `useUpdateUsername` odświeża `username`, którego nigdzie nie ma w `UserStats` ani w UI — feature bez widocznego efektu.
- Kosmetyka: app `name`/`slug` wciąż `"frontend"`, `<title>cms</title>`, martwe assety (`react.svg`, `vite.svg`, `hero.png`), boilerplate README w CMS, `SafeAreaView` nieużywany mimo zależności.
- **Brak jakichkolwiek testów i CI** (`.github/workflows` nie istnieje) — dla MVP akceptowalne, ale warto mieć choć smoke testy auth + loot.

---

## Sugerowana kolejność

1. **Auth admina + JWT secret** (blokery 1, 2) — jeden spójny PR: rola, `requireAdmin`, login w CMS, sekret z env.
2. **Env-driven URL-e + Maps key + uprawnienia lokalizacji** (3, 4) — bez tego nie ma działającego buildu.
3. **Usuń cheaty** (5) — szybkie, a krytyczne dla integralności gry.
4. **Hardening backendu**: walidacja, global error handler, transakcja na loot, cron try/catch (7, 8, 9).
5. **Reszta should-fix + polish.**
