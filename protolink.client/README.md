## ProtoLink Client

React + TypeScript + Vite frontend for ProtoLink.

### Prerequisites
- Node.js 20+
- PNPM or NPM (examples below use npm)
- .NET backend running and exposing `/api` (proxy is configured)

### Install
```bash
npm install
```

### Development
```bash
npm run dev
```
Dev server port is taken from `DEV_SERVER_PORT` env var (defaults to 57252). API calls to `/api/**` are proxied to the ASP.NET server discovered from `ASPNETCORE_HTTPS_PORT` or `ASPNETCORE_URLS`.

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

### Environment
Optional `.env` values used by `vite.config.ts`:
```
DEV_SERVER_PORT=57252
ASPNETCORE_HTTPS_PORT=7001
ASPNETCORE_URLS=https://localhost:7001;http://localhost:7000
```

### Auth and API
- Auth token is read from persisted Redux state and added to `Authorization` header in `src/utility/customAxios.ts`.
- Unauthenticated responses (401) redirect to `/login` with `returnurl`.

### Routing
`react-router-dom@7` is used. See `src/RootComponent.tsx` and `src/resources/routes-constants.ts`.

### Useful scripts
- `tools/create-demo.ps1` creates demo data against `http://localhost:5000/api` (adjust `$BaseUrl` if needed).

### Project structure
- `src/pages`: feature pages (Home, Admin, Login)
- `src/store`: Redux Toolkit store, slices, and thunks
- `src/utility`: axios setup and helpers
