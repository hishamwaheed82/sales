/** Enterprise UX preferences — persisted locally per browser (not tenant-scoped yet). */

const KEY = "softplan.sales.ux.v1";

export type UxPrefs = {
  sidebarCollapsed: boolean;
  favoritePages: string[];
  recentPages: string[];
};

const DEFAULTS: UxPrefs = {
  sidebarCollapsed: false,
  favoritePages: [],
  recentPages: [],
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

export function getUxPrefs(): UxPrefs {
  return read();
}

export function setSidebarCollapsed(v: boolean) {
  return write({ sidebarCollapsed: v });
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
