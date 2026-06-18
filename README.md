# 🔦 Blackout

Lokacyjna gra survivalowa. Gracz porusza się po realnej mapie (GPS), skanuje okolicę
w poszukiwaniu lokacji, lootuje je w ich pobliżu i zarządza ekwipunkiem, walcząc
z głodem, pragnieniem i utratą HP. Zebrane surowce można craftować, a postać zdobywa
XP i kolejne poziomy (zwiększające pojemność plecaka). Całością zarządza się z panelu CMS
(przedmioty, airdropy, gracze, konfiguracja gry).

> **Status:** projekt przed-MVP. Happy path działa end-to-end, ale przed wypuszczeniem
> pozostają zadania z zakresu bezpieczeństwa i konfiguracji — patrz [`roadmap.md`](roadmap.md).

---

## Spis treści

- [Funkcje](#funkcje)
- [Architektura](#architektura)
- [Stack technologiczny](#stack-technologiczny)
- [Wymagania wstępne](#wymagania-wstępne)
- [Szybki start](#szybki-start)
- [Zmienne środowiskowe](#zmienne-środowiskowe)
- [API](#api)
- [Model danych](#model-danych)
- [Dane testowe (seed)](#dane-testowe-seed)
- [Dostępne skrypty](#dostępne-skrypty)
- [Znane ograniczenia](#znane-ograniczenia)

---

## Funkcje

- 🔐 Rejestracja i logowanie (JWT)
- 🗺️ Mapa oparta o GPS, skanowanie okolicy (dane z OpenStreetMap / Overpass)
- 📦 Lootowanie lokacji z cooldownami i airdropów
- 🎒 Ekwipunek z limitem pojemności rosnącym wraz z poziomem
- 🔨 Crafting przedmiotów z surowców
- ❤️ System survival: HP, głód, pragnienie (degradacja w czasie przez cron) + respawn
- ⭐ XP i poziomy
- 🛠️ Panel CMS: zarządzanie przedmiotami, airdropami, graczami i konfiguracją gry

## Architektura

Monorepo z trzema niezależnymi aplikacjami i współdzielonymi typami:

```
blackout-game/
├── backend/      # API (Express 5 + Prisma + PostgreSQL)
├── frontend/     # Aplikacja gracza (Expo / React Native)
├── cms/          # Panel administracyjny (React + Vite)
├── shared/       # Współdzielone typy TypeScript (auth, inventory, location)
└── docker-compose.yml  # PostgreSQL
```

> Backend importuje współdzielone typy aliasem `@shared/*`, a własny kod aliasem `@/*`.

## Stack technologiczny

| Warstwa   | Technologie |
|-----------|-------------|
| Backend   | Node.js, Express 5, Prisma 5.15, PostgreSQL, JWT (`jsonwebtoken`), `bcrypt`, `node-cron` |
| Frontend  | Expo ~54, React Native 0.81, React 19, React Navigation, TanStack Query, `react-native-maps`, `expo-location`, `expo-secure-store`, Axios |
| CMS       | React 19, Vite 8, React Leaflet, Axios, `lucide-react` |
| Narzędzia | TypeScript 5.9, ESLint 9, Prettier |

## Wymagania wstępne

- **Node.js 22.19.0** (zob. [`.nvmrc`](.nvmrc) — `nvm use`)
- **Yarn** (każdy pakiet ma własny `yarn.lock`; brak workspaces — zależności instaluje się osobno w każdym katalogu)
- **Docker** + Docker Compose (PostgreSQL)
- Do uruchomienia aplikacji mobilnej: **Expo Go** na telefonie lub emulator iOS/Android

## Szybki start

### 1. Baza danych

```bash
docker compose up -d
```

Postgres wystartuje na **`localhost:5433`** (user: `admin`, hasło: `admin`, baza: `blackout_game`).

### 2. Backend

```bash
cd backend
yarn install

# utwórz plik .env (patrz sekcja "Zmienne środowiskowe")
npx prisma migrate dev      # zastosuj migracje
npx prisma generate         # wygeneruj klienta Prisma
npx prisma db seed          # załaduj dane testowe (opcjonalnie)

yarn dev                    # serwer na http://localhost:3000
```

### 3. CMS

```bash
cd cms
yarn install
yarn dev                    # panel na http://localhost:5173 (domyślny port Vite)
```

### 4. Frontend (aplikacja gracza)

```bash
cd frontend
yarn install
yarn start                  # Expo Dev Server (a, i — Android/iOS)
```

> ⚠️ **Adres API musi wskazywać na działający backend.** Aktualnie jest zaszyty na sztywno
> w [`frontend/src/utils/api.ts`](frontend/src/utils/api.ts) (`baseURL`) oraz
> [`cms/src/api/client.ts`](cms/src/api/client.ts). Do testów na fizycznym telefonie ustaw
> w nim **adres IP swojego komputera w sieci LAN** (np. `http://192.168.x.x:3000/api`) —
> `localhost` z telefonu nie zadziała. Docelowe przejście na zmienne środowiskowe opisuje
> [`roadmap.md`](roadmap.md) (bloker #3).

## Zmienne środowiskowe

### `backend/.env`

| Zmienna        | Opis | Przykład |
|----------------|------|----------|
| `DATABASE_URL` | Connection string do PostgreSQL | `postgresql://admin:admin@localhost:5433/blackout_game` |
| `JWT_SECRET`   | Sekret do podpisywania tokenów (**ustaw silny — patrz roadmap #2**) | `<losowy-ciąg>` |
| `PORT`         | Port serwera (opcjonalny, domyślnie `3000`) | `3000` |

> Obecnie `JWT_SECRET` i `PORT` mają fallback w kodzie — przed produkcją należy je wymusić
> (zob. [`roadmap.md`](roadmap.md)).

### Frontend / CMS

Adresy API są aktualnie zaszyte w kodzie (zob. ostrzeżenie wyżej). Docelowo:
`EXPO_PUBLIC_API_URL` (frontend) oraz `VITE_API_BASE` (CMS).

## API

Bazowy adres: `http://localhost:3000/api`. Endpointy oznaczone 🔒 wymagają nagłówka
`Authorization: Bearer <token>`.

### Auth — `/api/auth`
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| POST | `/register` | Rejestracja gracza |
| POST | `/login` | Logowanie, zwraca token JWT |

### Mapa — `/api/map`
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| 🔒 GET  | `/locations` | Lokacje na mapie (ze statusem cooldownu gracza) |
| 🔒 POST | `/locations/scan` | Skan okolicy — pobiera obiekty z OSM/Overpass |
| 🔒 POST | `/locations/spawn` | **(dev)** Spawn testowej skrzynki z lootem |
| 🔒 POST | `/locations/:id/loot` | Lootowanie lokacji |

### Ekwipunek — `/api/inventory`
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| 🔒 GET  | `/player` | Ekwipunek gracza |
| 🔒 POST | `/craft` | Crafting przedmiotu z receptury |
| 🔒 POST | `/:itemId/consume` | Zużycie przedmiotu (np. leczenie / jedzenie) |

### Gracz — `/api/player`
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| 🔒 GET   | `/stats` | Statystyki (HP, głód, pragnienie, XP, poziom) |
| 🔒 PATCH | `/username` | Zmiana nazwy gracza |
| 🔒 POST  | `/respawn` | Respawn po śmierci |

### Admin / CMS — `/api/admin`
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET   | `/items` | Lista przedmiotów |
| POST  | `/items` | Utworzenie przedmiotu |
| GET   | `/players` | Lista graczy |
| POST  | `/players/:id/kill` | Zabicie gracza |
| POST  | `/players/:id/heal` | Uleczenie gracza |
| PATCH | `/players/:id/level` | Ustawienie poziomu |
| POST  | `/airdrops` | Spawn airdropu |
| GET   | `/config` | Pobranie konfiguracji gry |
| PATCH | `/config` | Aktualizacja konfiguracji gry |

> ⚠️ Endpointy `/api/admin/*` **nie są obecnie chronione autoryzacją** — to bloker #1
> w [`roadmap.md`](roadmap.md). Nie wystawiać publicznie przed dodaniem auth.

## Model danych

Schemat Prisma podzielony jest na pliki w [`backend/prisma/schema/`](backend/prisma/schema/):

- **User** — konto gracza + statystyki (`hp`, `hunger`, `thirst`, `xp`, `level`)
- **Item** — definicja przedmiotu (`type`: `FOOD` / `WATER` / `MEDKIT` / `RESOURCE`)
- **InventoryItem** — przedmioty w ekwipunku gracza (z `quantity`)
- **Location** — lokacja na mapie (współrzędne, typ, opcjonalne `osmId`)
- **AirdropItem** — przedmioty przypisane do lokacji-airdropu
- **UserLocationCooldown** — cooldown lootowania (para gracz–lokacja)
- **GameConfig** — singleton konfiguracji (`xpPerLoot`, `baseStorage`, `storagePerLevel`)

## Dane testowe (seed)

`npx prisma db seed` **czyści bazę** i tworzy:

- **Gracza testowego** — login: `kamil@kamil.pl`, hasło: `test1234` (nick: `Survivor`)
- 4 przedmioty (Brudna Woda, Konserwa Turystyczna, Bandaż, Złom)
- 4 lokacje w okolicy współrzędnych `50.885, 21.67`
- Domyślną konfigurację gry (`xpPerLoot: 10`, `baseStorage: 10`, `storagePerLevel: 5`)

## Dostępne skrypty

**Root** (lint/format dla `backend`, `frontend`, `shared`):
```bash
yarn lint           # ESLint
yarn lint:fix       # ESLint z autofixem
yarn format         # Prettier --write
yarn format:check   # Prettier --check
```

**backend:** `yarn dev` (nodemon + ts-node)
**cms:** `yarn dev` · `yarn build` · `yarn preview` · `yarn lint`
**frontend:** `yarn start` · `yarn android` · `yarn ios` · `yarn web`

## Znane ograniczenia

Lista zadań do domknięcia przed wypuszczeniem MVP (bezpieczeństwo, konfiguracja, hardening)
znajduje się w [`roadmap.md`](roadmap.md). Najważniejsze: brak autoryzacji panelu admina,
zaszyty sekret JWT, zaszyte na sztywno adresy API oraz brak konfiguracji kluczy/uprawnień
map w buildzie produkcyjnym.
