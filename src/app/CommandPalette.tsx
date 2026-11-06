import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { getUxPrefs, pushRecentPage } from "./enterprisePrefs";

export type PaletteHit = { kind: string; label: string; sub?: string; page: string };

export function CommandPalette({
  navItems,
  onClose,
  setPage,
  extraHits = [],
  accentClass = "bg-blue-50",
  iconClass = "text-blue-600",
  markClass = "bg-blue-50 text-blue-900",
  placeholder = "ابحث…",
}: {
  navItems: { page: string; label: string }[];
  onClose: () => void;
  setPage: (p: string) => void;
  extraHits?: PaletteHit[];
  accentClass?: string;
  iconClass?: string;
  markClass?: string;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  const prefs = getUxPrefs();
  const menuHits: PaletteHit[] = navItems.map((n) => ({ kind: "Menu", label: n.label, page: n.page }));
  const recentHits: PaletteHit[] = prefs.recentPages.map((p) => ({
    kind: "Recent",
    label: menuHits.find((m) => m.page === p)?.label || p,
    page: p,
  }));
  const favHits: PaletteHit[] = prefs.favoritePages.map((p) => ({
    kind: "Favorite",
    label: menuHits.find((m) => m.page === p)?.label || p,
    page: p,
  }));

  const pool = [...favHits, ...recentHits, ...menuHits, ...extraHits];
  const ql = q.trim().toLowerCase();
  const filtered = (
    ql
      ? pool.filter(
          (i) =>
            i.label.toLowerCase().includes(ql) ||
            (i.sub || "").toLowerCase().includes(ql) ||
            i.kind.toLowerCase().includes(ql),
        )
      : [...favHits, ...recentHits, ...menuHits]
  )
    .filter(
      (item, idx, arr) =>
        arr.findIndex((x) => x.kind === item.kind && x.label === item.label && x.page === item.page) === idx,
    )
    .slice(0, 14);

  useEffect(() => {
    setHi(0);
  }, [q]);

  function go(item: PaletteHit) {
    pushRecentPage(item.page);
    setPage(item.page);
    onClose();
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((h) => Math.min(h + 1, filtered.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(h - 1, 0));
    }
    if (e.key === "Enter" && filtered[hi]) {
      e.preventDefault();
      go(filtered[hi]);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  function highlight(text: string) {
    if (!ql) return text;
    const i = text.toLowerCase().indexOf(ql);
    if (i < 0) return text;
    return (
      <>
        {text.slice(0, i)}
        <mark className={`${markClass} rounded px-0.5`}>{text.slice(i, i + ql.length)}</mark>
        {text.slice(i + ql.length)}
      </>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/45 z-50 flex items-start justify-center pt-[12vh] backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-200">
          <Search size={16} className={iconClass} />
          <input
            ref={ref}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder={placeholder}
            className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400"
          />
          <kbd className="text-[10px] bg-gray-100 border border-gray-200 rounded px-1.5">ESC</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-gray-500">لا نتائج — جرّب اسم صفحة أو كود</div>
          )}
          {filtered.map((item, i) => (
            <button
              key={`${item.kind}-${item.label}-${i}`}
              type="button"
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer text-start ${
                i === hi ? accentClass : "hover:bg-gray-50"
              }`}
              onMouseEnter={() => setHi(i)}
              onClick={() => go(item)}
            >
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 w-20 flex-shrink-0">
                {item.kind}
              </span>
              <span className="flex-1 text-gray-800 min-w-0 truncate">{highlight(item.label)}</span>
              {item.sub && <span className="text-[10px] text-gray-400 flex-shrink-0">{item.sub}</span>}
            </button>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-gray-200 flex gap-4 text-[10px] text-gray-400 bg-gray-50">
          <span>↑↓ تنقل</span>
          <span>↵ اختيار</span>
          <span>ESC إغلاق</span>
          <span className="ms-auto">Ctrl+K</span>
        </div>
      </div>
    </div>
  );
}
