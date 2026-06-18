# Blackout — Panel administracyjny (CMS)

Panel administracyjny gry Blackout: zarządzanie przedmiotami, graczami, zrzutami
zaopatrzenia (airdropami) oraz konfiguracją gry.

Stack: React + TypeScript + Vite, Leaflet (mapy), axios.

## Wymagania

- Uruchomiony backend (domyślnie `http://localhost:3000`).
- Konto z rolą `ADMIN` (zob. `backend/prisma/seed.ts`).

## Konfiguracja

Skopiuj `.env.example` do `.env` i ustaw adres API:

```bash
cp .env.example .env
# VITE_API_BASE=http://localhost:3000/api
```

## Uruchomienie

```bash
yarn        # instalacja zależności
yarn dev    # serwer deweloperski Vite
yarn build  # build produkcyjny
yarn lint   # ESLint
```

Logowanie odbywa się kontem administratora przez endpoint `/auth/login` backendu;
panel wysyła token w nagłówku `Authorization` i wymaga roli `ADMIN`.
