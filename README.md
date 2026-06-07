# NZ Leave Planner

Plan consecutive days off in New Zealand while minimising annual leave, using national public holidays (observed dates for Mon–Fri workers).

## Stack

- **v1**: Vite + React (`apps/web`) + shared logic (`packages/core`)
- Deploy target: **Azure Static Web Apps** (static `dist/` only)

## Development

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build & test

```bash
npm test
npm run build
npm run preview -w @nz-leave/web
```

## Export / import

Use **Export JSON** / **Import JSON** in the app to move settings between browsers (v2 will add cloud sync).

## v2 (planned)

- Azure Functions (C#) + Table Storage + SWA authentication
- **Extra days off**: regional anniversary, birthday leave, etc. — treated like public holidays in leave planning and shown in the holiday calendar
