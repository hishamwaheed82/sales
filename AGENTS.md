# account — دليل الـ repo (Accounting UI)

## الفكرة
واجهة نظام الحسابات (Vite + React + Tailwind، اتبنت من Figma Make). بتكلم **H.Accounting** API وبتسجّل دخول من **H.Auth**. Domain: `account.soft-planning.com`.

## الهيكل
- `src/` — الشاشات. `vite.config.ts` — الـ proxy المحلي لـ H.Accounting (`44400`) ولـ token endpoint بتاع Auth (`44380`).
- `.env.example` — متغيرات `VITE_API_BASE_URL` و`VITE_AUTH_*`.
- `backend/` — **Node mock قديم** (بورت 4000، `npm run dev:full`) من أول المشروع. مش بيتستخدم في production، الـ UI الفعلي بيكلم H.Accounting.

## تشغيل محلي
1. شغّل `H.Auth` (44380) و`H.Accounting` (44400).
2. `npm i` ثم `npm run dev` → `http://localhost:5173`.
3. Login: Tenant فاضي = Host، أو اسم Tenant.

## النشر
1. `git push origin main` → Build بس.
2. Actions → **Account UI CI/CD** → Run workflow → `main` (من غير inputs). Verify: `account.soft-planning.com`.

## حاجات مش واضحة
- الـ URLs بتتخبز وقت الـ build من الـ workflow: `VITE_API_BASE_URL` (acc-api)، `VITE_AUTH_URL` (auth)، `VITE_AUTH_CLIENT_ID` (`H_Accounting_App`)، `VITE_AUTH_SCOPE`. غيّر الدومين = عدّل الـ workflow وشغّله تاني.
- بيستخدم Environment `production` لـ Web Deploy secrets.
- لو الـ Login فشل بـ CORS: الأصل لازم يكون متضاف في H.Auth (CORS/redirect) — الـ workflow بتاع H.Auth.
- في الـ repo ملفات `DEMO_CREDENTIALS.md` و`RUN_LINKS.md` للاستخدام المحلي — ماتنسخهاش في docs عامة.

## Repos مرتبطة
`H.Accounting` · `H.Auth` · `H.Platform` · `portal`.
