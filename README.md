# Soft Plan — Purchases UI

Vite/React frontend for **H.Purchases** (suppliers + purchase invoices).

## Local

```powershell
npm install
npm run dev
```

- UI: http://localhost:5180
- API proxy → https://localhost:44450
- Auth proxy → https://localhost:44380 (`/connect`)

Client: `H_Purchases_App`  
Scope: `H.Purchases H.Platform openid profile email roles offline_access`

## Production

- UI: https://purchases.soft-planning.com
- API: https://purchases-api.soft-planning.com
