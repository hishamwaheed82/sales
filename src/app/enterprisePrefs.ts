/** Enterprise UX preferences — persisted locally per browser (not tenant-scoped yet). */

const KEY = "softplan.accounting.ux.v1";

export type UxPrefs = {
  sidebarCollapsed: boolean;
  openGroups: string[];
  favoritePages: string[];
  favoriteAccounts: string[];
  recentPages: string[];
  recentAccounts: string[];
};

const DEFAULTS: UxPrefs = {
  sidebarCollapsed: false,
  openGroups: ["Master Data", "Transactions", "Inquiry", "Reports", "Administration"],
  favoritePages: [],
  favoriteAccounts: ["1111", "1121", "4100", "5100"],
  recentPages: [],
  recentAccounts: [],
};

function read(): UxPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function write(patch: Partial<UxPrefs>) {
  const next = { ...read(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("softplan-ux-prefs"));
  return next;
}

export function notifyUxPrefsChanged() {
  window.dispatchEvent(new Event("softplan-ux-prefs"));
}

export function getUxPrefs(): UxPrefs {
  return read();
}

export function setSidebarCollapsed(v: boolean) {
  return write({ sidebarCollapsed: v });
}

export function setOpenGroups(groups: string[]) {
  return write({ openGroups: groups });
}

export function pushRecentPage(page: string, max = 8) {
  const cur = read();
  const recentPages = [page, ...cur.recentPages.filter((p) => p !== page)].slice(0, max);
  return write({ recentPages });
}

export function toggleFavoritePage(page: string) {
  const cur = read();
  const favoritePages = cur.favoritePages.includes(page)
    ? cur.favoritePages.filter((p) => p !== page)
    : [page, ...cur.favoritePages].slice(0, 12);
  return write({ favoritePages });
}

export function isFavoritePage(page: string) {
  return read().favoritePages.includes(page);
}

export function pushRecentAccount(code: string, max = 10) {
  const cur = read();
  const recentAccounts = [code, ...cur.recentAccounts.filter((c) => c !== code)].slice(0, max);
  return write({ recentAccounts });
}

export function toggleFavoriteAccount(code: string) {
  const cur = read();
  const favoriteAccounts = cur.favoriteAccounts.includes(code)
    ? cur.favoriteAccounts.filter((c) => c !== code)
    : [code, ...cur.favoriteAccounts].slice(0, 20);
  return write({ favoriteAccounts });
}

export function isFavoriteAccount(code: string) {
  return read().favoriteAccounts.includes(code);
}
