# Soft Plan Accounting — Demo Users

UI: http://localhost:5173

Project context: `../PROJECT_CONTEXT.md`

---

## Host / Platform Admin (Tenants page)

| Field | Value |
|--------|--------|
| **Tenant** | leave **empty** |
| **Username** | `admin` |
| **Password** | `1q2w3E*` |
| Result | Host session — can open **Tenants** |

Token request must include `grant_type=password`. Do **not** send `__tenant` for Host.

---

## Tenant login (e.g. mcc)

| Field | Value |
|--------|--------|
| **Tenant** | tenant name exactly (`mcc`) |
| **Username** | `admin` |
| **Password** | `1q2w3E*` (same default after create) |

Browser / DevTools: header `__tenant: mcc`  
Postman / curl: same header on `POST /connect/token`.

---

## Local stack

| Service | URL |
|---------|-----|
| Accounting UI | http://localhost:5173 |
| Accounting API | https://localhost:44400 |
| Auth | https://localhost:44380 |

Vite proxies `/connect` → Auth and `/api` → Accounting API.
