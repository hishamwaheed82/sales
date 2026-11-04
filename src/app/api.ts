const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "/api/v1";
// In Vite DEV always use same-origin /connect (proxied to H.Auth) — avoids CORS +
// browser rejection of the ASP.NET HTTPS development certificate on :44380.
const AUTH_URL = (import.meta as any).env?.DEV
  ? ""
  : String((import.meta as any).env?.VITE_AUTH_URL ?? "").replace(/\/$/, "");
const AUTH_TOKEN_URL = AUTH_URL ? `${AUTH_URL}/connect/token` : "/connect/token";
const AUTH_CLIENT_ID = (import.meta as any).env?.VITE_AUTH_CLIENT_ID || "H_Sales_App";
const AUTH_SCOPE =
  (import.meta as any).env?.VITE_AUTH_SCOPE ||
  "H.Sales H.Platform openid profile email roles offline_access";

const TOKEN_KEY = "softplan_sal_token";
const PKCE_KEY = "softplan_sal_pkce";
const TENANT_KEY = "softplan_sal_tenant";
const USER_KEY = "softplan_sal_user";
const SESSION_EXPIRED_EVENT = "softplan:session-expired";

type SessionExpiredListener = () => void;
const sessionExpiredListeners = new Set<SessionExpiredListener>();
let sessionExpiredNotifying = false;

/** Subscribe to forced logout (401 / invalid session). Returns unsubscribe. */
export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

function notifySessionExpired() {
  if (sessionExpiredNotifying) return;
  sessionExpiredNotifying = true;
  for (const listener of [...sessionExpiredListeners]) {
    try {
      listener();
    } catch {
      /* ignore listener errors */
    }
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  }
  queueMicrotask(() => {
    sessionExpiredNotifying = false;
  });
}

/**
 * Clears local session and notifies the app shell to show LoginScreen.
 * Pass `silent: true` for intentional logout (no toast / no double notify).
 */
export function forceLogin(reason?: string, opts?: { silent?: boolean }) {
  clearSession();
  if (opts?.silent) return;
  notifySessionExpired();
}

export type SessionUser = {
  id: string;
  username: string;
  email: string;
  nameAr: string;
  nameEn: string;
  role: string;
  tenantId?: string | null;
  permissions?: string[];
  isPlatformAdmin?: boolean;
};

export type SessionTenant = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  fiscalYear?: string;
  baseCurrency?: string;
  city?: string;
};

// ── Sales DTOs ───────────────────────────────────────────────────────────────

export type CustomerDto = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
};

export type CreateUpdateCustomerDto = {
  code: string;
  name: string;
  isActive?: boolean;
};

export type SalesInvoiceLineDto = {
  id?: string;
  lineNumber: number;
  itemId?: string | null;
  description?: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type CreateSalesInvoiceLineDto = {
  itemId?: string;
  description?: string;
  qty: number;
  unitPrice: number;
};

/** Status: 1=Draft, 2=Posted */
export type SalesInvoiceDto = {
  id: string;
  number: string;
  docDate: string;
  customerId: string;
  customerCode?: string;
  customerName?: string;
  warehouseId?: string | null;
  status: number;
  subTotal: number;
  taxTotal: number;
  grandTotal: number;
  journalNumber?: string;
  stockDocumentId?: string;
  lines: SalesInvoiceLineDto[];
};

export type CreateSalesInvoiceDto = {
  docDate?: string;
  customerId: string;
  warehouseId?: string;
  taxTotal?: number;
  post?: boolean;
  lines: CreateSalesInvoiceLineDto[];
};

export type WarehouseLookupDto = {
  id: string;
  code: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
};

export type ItemLookupDto = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
};

export type BootstrapDto = {
  customers: CustomerDto[];
  recentInvoices: SalesInvoiceDto[];
  warehouses?: WarehouseLookupDto[];
  items?: ItemLookupDto[];
};

// ── Auth helpers ─────────────────────────────────────────────────────────────

/** OpenIddict access tokens are JWTs; legacy Node demo tokens are opaque. */
function isAbpAccessToken(token: string | null | undefined): boolean {
  if (!token) return false;
  return token.split(".").length === 3 && token.length > 80;
}

/** Decode JWT payload (no signature verify — display/session only). */
function sessionFromAccessToken(accessToken: string) {
  const claims = parseJwtPayload(accessToken);
  const jwtTenantId = (claims.tenantid ?? claims.tenant_id ?? claims.TenantId) as string | undefined | null;
  const isHost = jwtTenantId == null || jwtTenantId === "";
  const preferred =
    (claims.preferred_username as string) ||
    (claims.unique_name as string) ||
    (claims.name as string) ||
    "user";
  const email = (claims.email as string) || (preferred.includes("@") ? preferred : `${preferred}@local`);
  const user: SessionUser = {
    id: (claims.sub as string) || preferred,
    username: preferred,
    email,
    nameAr: preferred,
    nameEn: preferred,
    role: (claims.role as string) || "admin",
    tenantId: isHost ? null : String(jwtTenantId),
    isPlatformAdmin: isHost
  };
  const tenant: SessionTenant | null = isHost
    ? { id: "host", code: "HOST", nameAr: "Host", nameEn: "Host" }
    : {
        id: String(jwtTenantId),
        code: String(jwtTenantId),
        nameAr: String(jwtTenantId),
        nameEn: String(jwtTenantId)
      };
  return {
    accessToken,
    user,
    tenant,
    tenants: tenant ? [tenant] : []
  };
}

function randomUrlSafe(bytes: number) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  let text = "";
  for (const byte of data) text += String.fromCharCode(byte);
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256Base64Url(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  let text = "";
  for (const byte of new Uint8Array(digest)) text += String.fromCharCode(byte);
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function parseJwtPayload(token: string): Record<string, unknown> {
  try {
    const part = token.split(".")[1];
    if (!part) return {};
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return {};
  }
}

/** `true`/`false` from JWT tenant claim; `null` if token missing/opaque. */
export function isHostFromToken(token?: string | null): boolean | null {
  const t = token || getStoredToken();
  if (!t || !isAbpAccessToken(t)) return null;
  const claims = parseJwtPayload(t);
  const tid = claims.tenantid ?? claims.tenant_id ?? claims.TenantId;
  return tid == null || tid === "";
}

export function isHostSession(user?: SessionUser | null, tenant?: SessionTenant | null): boolean {
  const fromJwt = isHostFromToken();
  if (fromJwt === true) return true;
  if (fromJwt === false) return false;
  if (user?.isPlatformAdmin) return true;
  if (user?.tenantId) return false;
  if (tenant?.id && tenant.id !== "host" && tenant.code && tenant.code !== "HOST") return false;
  return !user?.tenantId;
}

function authHeaders(opts?: { json?: boolean }): Record<string, string> {
  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (opts?.json !== false) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const tenant = getStoredTenant();
  if (tenant?.id && tenant.id !== "host" && tenant.code && tenant.code !== "HOST" && tenant.code !== "Default") {
    headers.__tenant = tenant.code;
  }
  return headers;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers || {}) }
  });
  if (!res.ok) {
    const raw = await res.text();

    if (res.status === 401) {
      forceLogin("HTTP 401");
      throw new Error("انتهت الجلسة. يرجى تسجيل الدخول مجدداً.");
    }

    if (res.status === 404 && /Tenant not found/i.test(raw)) {
      forceLogin("invalid-tenant");
      throw new Error("المستأجر غير صالح. يرجى تسجيل الدخول مجدداً.");
    }
    let err: any = {};
    try {
      err = JSON.parse(raw);
    } catch {
      /* HTML or empty body */
    }
    const message =
      err?.error?.message ||
      err?.error_description ||
      err?.message ||
      `Request failed (${res.status})`;
    const reason =
      err?.error?.data?.Reason ||
      err?.error?.data?.reason ||
      err?.data?.Reason ||
      err?.data?.reason;
    throw new Error(reason ? `${message} — ${reason}` : message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function getStoredToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && !isAbpAccessToken(token)) {
    clearSession();
    return null;
  }
  return token;
}

export function getStoredUser(): SessionUser | null {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function getStoredTenant(): SessionTenant | null {
  try {
    return JSON.parse(localStorage.getItem(TENANT_KEY) || "null");
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TENANT_KEY);
  clearTenantCookies();
}

function clearTenantCookies() {
  if (typeof document === "undefined") return;
  for (const name of ["__tenant", "Abp.TenantId", "Abp.TenantKey"]) {
    document.cookie = `${name}=; Path=/; Max-Age=0`;
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}

export function saveSession(payload: {
  accessToken: string;
  user: SessionUser;
  tenant: SessionTenant | null;
}) {
  localStorage.setItem(TOKEN_KEY, payload.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  if (payload.tenant) localStorage.setItem(TENANT_KEY, JSON.stringify(payload.tenant));
  else localStorage.removeItem(TENANT_KEY);
}

async function passwordLogin(username: string, password: string, tenantCode?: string) {
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: AUTH_CLIENT_ID,
    username,
    password,
    scope: AUTH_SCOPE
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json"
  };
  const code = tenantCode?.trim();
  if (code) headers.__tenant = code;

  const res = await fetch(AUTH_TOKEN_URL, {
    method: "POST",
    headers,
    body,
    credentials: "omit"
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || !payload.access_token) {
    const detail = payload.error_description || payload.error || "Login failed";
    throw new Error(typeof detail === "string" ? detail : "Login failed");
  }
  return payload as { access_token: string; refresh_token?: string };
}

export const api = {
  health: () => request<{ ok: boolean }>("/health"),

  login: async (body: { username: string; password: string; tenantCode?: string }) => {
    clearSession();
    clearTenantCookies();

    const raw = (body.tenantCode || "").trim();
    const tenantCode = !raw || /^(host|null|undefined)$/i.test(raw) ? "" : raw;

    const tokens = await passwordLogin(body.username, body.password, tenantCode || undefined);
    const claims = parseJwtPayload(tokens.access_token);
    const jwtTenantId = (claims.tenantid ?? claims.tenant_id ?? claims.TenantId) as string | undefined | null;
    const isHost = jwtTenantId == null || jwtTenantId === "";

    if (!tenantCode && !isHost) {
      throw new Error(
        "Host login returned a Tenant token. Clear site cookies for localhost:5180 and retry with an empty Tenant field."
      );
    }
    if (tenantCode && isHost) {
      throw new Error(
        `Expected Tenant "${tenantCode}" but Auth returned a Host token. Check the Tenant code.`
      );
    }

    const preferred =
      (claims.preferred_username as string) ||
      (claims.unique_name as string) ||
      body.username;
    const email = (claims.email as string) || (preferred.includes("@") ? preferred : `${preferred}@local`);

    const user: SessionUser = {
      id: (claims.sub as string) || preferred,
      username: preferred,
      email,
      nameAr: preferred,
      nameEn: preferred,
      role: (claims.role as string) || "admin",
      tenantId: isHost ? null : String(jwtTenantId),
      isPlatformAdmin: isHost
    };
    const tenant: SessionTenant | null = isHost
      ? { id: "host", code: "HOST", nameAr: "Host", nameEn: "Host" }
      : {
          id: String(jwtTenantId),
          code: tenantCode || String(jwtTenantId),
          nameAr: tenantCode || "Tenant",
          nameEn: tenantCode || "Tenant"
        };
    return {
      accessToken: tokens.access_token,
      user,
      tenant,
      tenants: tenant ? [tenant] : []
    };
  },

  beginCodeLogin() {
    const verifier = randomUrlSafe(64);
    const state = randomUrlSafe(24);
    sessionStorage.setItem(PKCE_KEY, JSON.stringify({ verifier, state }));
    return sha256Base64Url(verifier).then((challenge) => {
      const redirectUri = `${location.origin}/auth/callback`;
      const authBase = AUTH_URL || "";
      const url = new URL(`${authBase}/connect/authorize`, location.origin);
      url.searchParams.set("client_id", AUTH_CLIENT_ID);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", AUTH_SCOPE);
      url.searchParams.set("code_challenge", challenge);
      url.searchParams.set("code_challenge_method", "S256");
      url.searchParams.set("state", state);
      location.assign(url.toString());
    });
  },

  async completeCodeLogin() {
    const params = new URLSearchParams(location.search);
    const described = params.get("error_description") || params.get("error");
    if (described) throw new Error(described);
    const code = params.get("code");
    const state = params.get("state");
    const stored = JSON.parse(sessionStorage.getItem(PKCE_KEY) || "null") as { verifier?: string; state?: string } | null;
    sessionStorage.removeItem(PKCE_KEY);
    if (!code || !stored?.verifier || !state || state !== stored.state) {
      throw new Error("Login callback was rejected.");
    }
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: AUTH_CLIENT_ID,
      code,
      redirect_uri: `${location.origin}/auth/callback`,
      code_verifier: stored.verifier
    });
    const res = await fetch(AUTH_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body,
      credentials: "omit"
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload.access_token) {
      throw new Error(payload.error_description || payload.error || "Login failed");
    }
    return sessionFromAccessToken(payload.access_token as string);
  },

  logout: async () => {
    clearSession();
    const redirectUri = location.origin;
    const authBase = AUTH_URL || "";
    const url = new URL(`${authBase}/connect/logout`, location.origin);
    url.searchParams.set("client_id", AUTH_CLIENT_ID);
    url.searchParams.set("post_logout_redirect_uri", redirectUri);
    location.assign(url.toString());
    return { ok: true };
  },

  tenants: async () => {
    const t = getStoredTenant();
    return t ? [t] : [];
  },

  switchTenant: async (tenantId: string) => {
    const tenant: SessionTenant = {
      id: tenantId,
      code: tenantId,
      nameAr: tenantId,
      nameEn: tenantId
    };
    localStorage.setItem(TENANT_KEY, JSON.stringify(tenant));
    return { ok: true, tenant };
  },

  // ── Sales endpoints (/api/v1/...) ───────────────────────────────────────────

  bootstrap: () => request<BootstrapDto>("/bootstrap"),

  getCustomers: () => request<CustomerDto[]>("/customers"),
  createCustomer: (body: CreateUpdateCustomerDto) =>
    request<CustomerDto>("/customers", { method: "POST", body: JSON.stringify(body) }),
  updateCustomer: (id: string, body: CreateUpdateCustomerDto) =>
    request<CustomerDto>(`/customers/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  getInvoices: () => request<SalesInvoiceDto[]>("/invoices"),
  createInvoice: (body: CreateSalesInvoiceDto) =>
    request<SalesInvoiceDto>("/invoices", { method: "POST", body: JSON.stringify(body) }),
  postInvoice: (id: string) =>
    request<SalesInvoiceDto>(`/invoices/${id}/post`, { method: "POST" }),
};

export { API_BASE };
