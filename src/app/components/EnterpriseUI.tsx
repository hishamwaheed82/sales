import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { Inbox, Loader2, X } from "lucide-react";

/** Sticky page header + optional actions — use on list/report pages without redesigning them. */
export function PageShell({
  title,
  subtitle,
  actions,
  children,
  sticky = true,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  sticky?: boolean;
}) {
  return (
    <div className="space-y-4 animate-page-in">
      <div
        className={`flex items-start justify-between gap-3 flex-wrap ${
          sticky ? "sticky top-0 z-20 -mx-1 px-1 py-2 bg-[#F4F7FC]/95 backdrop-blur-sm border-b border-transparent" : ""
        }`}
      >
        <div className="min-w-0">
          <div className="text-xl font-bold text-[#0D1B2E]">{title}</div>
          {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-14 rounded-xl border border-dashed border-[#C5D4E8] bg-white">
      <div className="w-12 h-12 rounded-2xl bg-[#E8F0FB] text-[#1A4F8C] flex items-center justify-center mb-3">
        {icon || <Inbox size={22} />}
      </div>
      <p className="text-sm font-semibold text-[#0D1B2E]">{title}</p>
      {description && <p className="text-xs text-slate-500 mt-1.5 max-w-sm leading-relaxed">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SkeletonBlock({ rows = 6, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 rounded-lg bg-slate-100/80 animate-pulse" style={{ opacity: 1 - i * 0.08 }} />
      ))}
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  danger,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] bg-black/45 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-page-in"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <div className="px-5 py-4 border-b border-[#E0E8F4] flex items-start justify-between gap-3">
          <div>
            <h3 id="confirm-dialog-title" className="text-sm font-bold text-[#0D1B2E]">{title}</h3>
            <p id="confirm-dialog-message" className="text-xs text-slate-500 mt-1.5 leading-relaxed">{message}</p>
          </div>
          <button type="button" onClick={onCancel} aria-label="إغلاق" className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4 bg-[#F4F7FC] flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="text-xs px-4 py-2 rounded-lg border border-[#E0E8F4] bg-white text-slate-600 hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`text-xs px-4 py-2 rounded-lg text-white font-semibold flex items-center gap-2 ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-[#1A4F8C] hover:bg-[#163f70]"
            }`}
          >
            {busy && <Loader2 size={13} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export type CtxMenuItem = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
};

export function useContextMenu() {
  const [state, setState] = useState<{ x: number; y: number; items: CtxMenuItem[] } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state) return;
    const close = () => setState(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("click", close);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
    };
  }, [state]);

  function open(e: ReactMouseEvent, items: CtxMenuItem[]) {
    e.preventDefault();
    e.stopPropagation();
    const pad = 8;
    const w = 220;
    const h = items.length * 36 + 16;
    const x = Math.min(e.clientX, window.innerWidth - w - pad);
    const y = Math.min(e.clientY, window.innerHeight - h - pad);
    setState({ x, y, items });
  }

  const menu = state ? (
    <div
      ref={ref}
      className="fixed z-[90] min-w-[200px] bg-white border border-[#E0E8F4] rounded-xl shadow-xl py-1.5 animate-page-in"
      style={{ left: state.x, top: state.y }}
      onClick={(e) => e.stopPropagation()}
    >
      {state.items.map((item, i) =>
        item.separator ? (
          <div key={i} className="my-1 border-t border-[#F0F4FA]" />
        ) : (
          <button
            key={i}
            type="button"
            disabled={item.disabled}
            onClick={() => {
              if (item.disabled) return;
              setState(null);
              item.onClick();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-start transition-colors disabled:opacity-40 ${
              item.danger ? "text-red-600 hover:bg-red-50" : "text-[#0D1B2E] hover:bg-[#F4F7FC]"
            }`}
          >
            <span className="text-slate-400 w-4 flex justify-center">{item.icon}</span>
            {item.label}
          </button>
        )
      )}
    </div>
  ) : null;

  return { open, menu, close: () => setState(null) };
}

/** Enterprise table wrapper: sticky header + zebra + hover without rewriting columns. */
export function DataTableShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-[#E0E8F4] shadow-sm overflow-hidden ${className}`}>
      <div className="enterprise-table overflow-auto max-h-[min(70vh,720px)]">{children}</div>
    </div>
  );
}
