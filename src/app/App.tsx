import { useState, useEffect, useCallback } from "react";
import { Toaster, toast } from "sonner";
import {
  LayoutDashboard, Users, FileText,
  ChevronLeft, Bell, User, LogOut, Plus, Check, X,
  RefreshCw, Search, Menu, TrendingUp, ShoppingBag, Trash2, Warehouse,
  Printer,
} from "lucide-react";
import {
  api,
  forceLogin,
  getStoredTenant,
  getStoredToken,
  getStoredUser,
  onSessionExpired,
  saveSession,
  type BootstrapDto,
  type CustomerDto,
  type SalesInvoiceDto,
  type WarehouseLookupDto,
  type ItemLookupDto,
  type SessionTenant,
  type SessionUser,
} from "./api";
import { LoginScreen } from "./LoginScreen";

// ─── Types ──────────────────────────────────────────────────────────────────
type Page = "dashboard" | "customers" | "invoices";

const DOC_STATUS_LABEL: Record<number, string> = {
  1: "مسودة",
  2: "مرحّل",
  3: "ملغى",
};
const DOC_STATUS_COLOR: Record<number, string> = {
  1: "bg-yellow-100 text-yellow-800",
  2: "bg-green-100 text-green-800",
  3: "bg-red-100 text-red-700",
};

const fmt = (n: number) => n.toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const NAV_ITEMS: { page: Page; label: string; icon: React.ReactNode }[] = [
  { page: "dashboard", label: "لوحة التحكم", icon: <LayoutDashboard size={18} /> },
  { page: "customers", label: "العملاء",      icon: <Users size={18} /> },
  { page: "invoices",  label: "فواتير البيع", icon: <FileText size={18} /> },
];

// ─── App shell ───────────────────────────────────────────────────────────────
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [tenant, setTenant] = useState<SessionTenant | null>(null);
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [bootstrap, setBootstrap] = useState<BootstrapDto | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    const storedTenant = getStoredTenant();
    if (token && storedUser) {
      setUser(storedUser);
      setTenant(storedTenant);
      setLoggedIn(true);
    }
    return onSessionExpired(() => {
      setLoggedIn(false);
      setUser(null);
      setTenant(null);
      setBootstrap(null);
      toast.error("انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.");
    });
  }, []);

  const loadBootstrap = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.bootstrap();
      setBootstrap(data);
    } catch (err: any) {
      toast.error(err.message || "فشل تحميل البيانات.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loggedIn) loadBootstrap();
  }, [loggedIn, loadBootstrap]);

  const handleLogin = async (creds: { username: string; password: string; tenantCode?: string }) => {
    const result = await api.login(creds);
    saveSession({ accessToken: result.accessToken, user: result.user, tenant: result.tenant });
    setUser(result.user);
    setTenant(result.tenant);
    setLoggedIn(true);
  };

  const handleLogout = async () => {
    forceLogin("user logout", { silent: true });
    setLoggedIn(false);
    setUser(null);
    setTenant(null);
    setBootstrap(null);
  };

  if (!loggedIn) {
    return (
      <>
        <LoginScreen onLogin={handleLogin} appName="نظام المبيعات" />
        <Toaster position="top-left" richColors />
      </>
    );
  }

  return (
    <div dir="rtl" className="flex h-screen bg-gray-50 font-sans text-gray-800" style={{ fontFamily: "'Cairo', 'Segoe UI', sans-serif" }}>
      <aside
        className={`flex flex-col bg-slate-900 text-white transition-all duration-300 ${sidebarOpen ? "w-56" : "w-16"} flex-shrink-0`}
      >
        <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-700">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <ShoppingBag size={16} />
          </div>
          {sidebarOpen && <span className="text-sm font-bold leading-tight">المبيعات</span>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mr-auto text-slate-400 hover:text-white"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
          </button>
        </div>

        <nav className="flex-1 py-3 space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.page}
              onClick={() => setPage(item.page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                page === item.page
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="border-t border-slate-700 p-3">
            <div className="text-xs text-slate-400 truncate">{user?.username}</div>
            {tenant && tenant.code !== "HOST" && (
              <div className="text-xs text-slate-500 truncate">{tenant.nameAr}</div>
            )}
            <button
              onClick={handleLogout}
              className="mt-2 flex items-center gap-2 text-xs text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut size={13} />
              تسجيل خروج
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-3 bg-white border-b border-gray-200 px-5 py-3">
          <h1 className="text-base font-semibold text-gray-700">
            {NAV_ITEMS.find((n) => n.page === page)?.label ?? ""}
          </h1>
          <div className="mr-auto flex items-center gap-2">
            <button
              onClick={loadBootstrap}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="تحديث البيانات"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <Bell size={16} />
            </button>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <User size={15} />
              <span>{user?.username}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {loading && !bootstrap ? (
            <div className="flex items-center justify-center h-40 gap-3 text-gray-500">
              <RefreshCw size={20} className="animate-spin" />
              <span>جاري تحميل البيانات…</span>
            </div>
          ) : (
            <>
              {page === "dashboard" && <DashboardPage bootstrap={bootstrap} />}
              {page === "customers" && (
                <CustomersPage
                  customers={bootstrap?.customers ?? []}
                  onRefresh={loadBootstrap}
                />
              )}
              {page === "invoices" && (
                <InvoicesPage
                  invoices={bootstrap?.recentInvoices ?? []}
                  customers={bootstrap?.customers ?? []}
                  warehouses={bootstrap?.warehouses ?? []}
                  items={bootstrap?.items ?? []}
                  onRefresh={loadBootstrap}
                />
              )}
            </>
          )}
        </div>
      </main>
      <Toaster position="top-left" richColors />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────
function DashboardPage({ bootstrap }: { bootstrap: BootstrapDto | null }) {
  if (!bootstrap) return null;

  const draftCount = bootstrap.recentInvoices.filter((v) => v.status === 1).length;
  const postedTotal = bootstrap.recentInvoices
    .filter((v) => v.status === 2)
    .reduce((s, v) => s + (v.grandTotal || 0), 0);

  const cards = [
    {
      title: "العملاء",
      value: bootstrap.customers.length.toLocaleString("ar-EG"),
      icon: <Users size={22} className="text-blue-500" />,
      bg: "bg-blue-50",
    },
    {
      title: "فواتير المسودة",
      value: draftCount.toLocaleString("ar-EG"),
      icon: <FileText size={22} className="text-yellow-500" />,
      bg: "bg-yellow-50",
    },
    {
      title: "إجمالي المرحّل",
      value: fmt(postedTotal),
      icon: <TrendingUp size={22} className="text-green-500" />,
      bg: "bg-green-50",
    },
    {
      title: "آخر الفواتير",
      value: bootstrap.recentInvoices.length.toLocaleString("ar-EG"),
      icon: <ShoppingBag size={22} className="text-indigo-500" />,
      bg: "bg-indigo-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.title} className={`${c.bg} rounded-xl p-5 flex items-center gap-4`}>
            <div className="p-2 bg-white rounded-lg shadow-sm">{c.icon}</div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">{c.title}</p>
              <p className="text-xl font-bold text-gray-800">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">آخر فواتير البيع</h2>
        </div>
        {bootstrap.recentInvoices.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">لا توجد فواتير مسجّلة بعد.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="px-4 py-2 text-right">رقم</th>
                <th className="px-4 py-2 text-right">العميل</th>
                <th className="px-4 py-2 text-right">الإجمالي</th>
                <th className="px-4 py-2 text-right">التاريخ</th>
                <th className="px-4 py-2 text-right">قيد GL</th>
                <th className="px-4 py-2 text-right">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bootstrap.recentInvoices.slice(0, 8).map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs">{v.number}</td>
                  <td className="px-4 py-2">{v.customerName ?? v.customerCode ?? "—"}</td>
                  <td className="px-4 py-2 font-medium">{fmt(v.grandTotal)}</td>
                  <td className="px-4 py-2 text-gray-500">{new Date(v.docDate).toLocaleDateString("ar-EG")}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-500">{v.journalNumber ?? "—"}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${DOC_STATUS_COLOR[v.status] ?? "bg-gray-100"}`}>
                      {DOC_STATUS_LABEL[v.status] ?? v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Customers
// ─────────────────────────────────────────────────────────────────────────────
function CustomersPage({ customers, onRefresh }: { customers: CustomerDto[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", phone: "", email: "" });

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("الكود والاسم مطلوبان.");
      return;
    }
    setSaving(true);
    try {
      await api.createCustomer({
        code:  form.code.trim(),
        name:  form.name.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        isActive: true,
      });
      toast.success("تم إضافة العميل بنجاح.");
      setShowForm(false);
      setForm({ code: "", name: "", phone: "", email: "" });
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "فشل حفظ العميل.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{customers.length} عميل</span>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} />
          عميل جديد
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">إضافة عميل جديد</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">الكود *</label>
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">الاسم *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">الهاتف (Phone)</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="اختياري — مثال: 0100xxxxxxx"
                  maxLength={32}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">البريد الإلكتروني (Email)</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="اختياري — مثال: info@example.com"
                  type="email"
                  maxLength={128}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">إلغاء</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {customers.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm bg-white rounded-xl border border-gray-200">
          لا يوجد عملاء مسجّلون بعد.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
              <div className="p-2.5 bg-blue-50 rounded-lg">
                <Users size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-800">{s.name}</div>
                <div className="text-xs text-gray-400 mt-0.5 font-mono">{s.code}</div>
                {s.phone && (
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <span className="text-gray-400">📞</span> {s.phone}
                  </div>
                )}
                {s.email && (
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 truncate">
                    <span className="text-gray-400">✉</span> {s.email}
                  </div>
                )}
                <div className={`mt-2 text-xs ${s.isActive ? "text-green-600" : "text-gray-400"}`}>
                  {s.isActive ? "نشط" : "موقوف"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Invoices (create + post + detail drawer)
// ─────────────────────────────────────────────────────────────────────────────
type LineDraft = { itemId: string; description: string; qty: string; unitPrice: string };

function warehouseLabel(
  warehouseId: string | null | undefined,
  warehouses: WarehouseLookupDto[],
): string {
  if (!warehouseId) return "—";
  const wh = warehouses.find((w) => w.id === warehouseId);
  return wh ? `${wh.name} (${wh.code})` : warehouseId;
}

function printInvoice(inv: SalesInvoiceDto, warehouseText: string) {
  const linesHtml = (inv.lines ?? [])
    .map(
      (l) => `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:right">${l.lineNumber}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:right">${l.description ?? "—"}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:right">${l.qty}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:right">${fmt(l.unitPrice)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:right">${fmt(l.lineTotal)}</td>
      </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/>
    <title>فاتورة ${inv.number}</title>
    <style>
      body{font-family:Cairo,'Segoe UI',Tahoma,sans-serif;color:#111;padding:24px;direction:rtl}
      h1{font-size:18px;margin:0 0 16px}
      .meta{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;font-size:13px;margin-bottom:20px}
      .meta span{color:#666}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th{background:#f3f4f6;padding:8px;text-align:right;border-bottom:2px solid #ccc}
      .totals{margin-top:16px;font-size:13px;text-align:left}
      .totals div{margin:4px 0}
      .grand{font-weight:700;font-size:15px}
    </style></head><body>
    <h1>فاتورة بيع — ${inv.number}</h1>
    <div class="meta">
      <div><span>العميل:</span> ${inv.customerName ?? inv.customerCode ?? "—"}</div>
      <div><span>التاريخ:</span> ${new Date(inv.docDate).toLocaleDateString("ar-EG")}</div>
      <div><span>الحالة:</span> ${DOC_STATUS_LABEL[inv.status] ?? inv.status}</div>
      <div><span>المستودع:</span> ${warehouseText}</div>
      <div><span>قيد GL:</span> ${inv.journalNumber ?? "—"}</div>
      <div><span>Stock Document:</span> ${inv.stockDocumentId ?? "—"}</div>
    </div>
    <table>
      <thead><tr>
        <th>#</th><th>الوصف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th>
      </tr></thead>
      <tbody>${linesHtml || `<tr><td colspan="5" style="padding:12px;text-align:center;color:#999">لا توجد أسطر</td></tr>`}</tbody>
    </table>
    <div class="totals">
      <div>الإجمالي الفرعي: ${fmt(inv.subTotal)}</div>
      <div>الضريبة: ${fmt(inv.taxTotal)}</div>
      <div class="grand">الإجمالي: ${fmt(inv.grandTotal)}</div>
    </div>
    <script>window.onload=function(){window.print();}</script>
    </body></html>`;

  const w = window.open("", "_blank", "noopener,noreferrer,width=860,height=720");
  if (!w) {
    toast.error("تعذر فتح نافذة الطباعة — تحقق من إعدادات المتصفح.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function InvoiceDetailDrawer({
  invoice,
  warehouses,
  posting,
  cancelling,
  onClose,
  onPost,
  onCancel,
  onPrint,
}: {
  invoice: SalesInvoiceDto;
  warehouses: WarehouseLookupDto[];
  posting: boolean;
  cancelling: boolean;
  onClose: () => void;
  onPost: () => void;
  onCancel: () => void;
  onPrint: () => void;
}) {
  const whText = warehouseLabel(invoice.warehouseId, warehouses);
  const isDraft = invoice.status === 1;
  const lines = invoice.lines ?? [];

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 border-0 cursor-default"
        aria-label="إغلاق"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 right-0 z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl border-l border-gray-200 animate-drawer-in animate-page-in">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-800">تفاصيل الفاتورة</h2>
            <p className="mt-0.5 font-mono text-xs text-blue-700">{invoice.number}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <DetailField label="العميل" value={invoice.customerName ?? invoice.customerCode ?? "—"} />
            <DetailField label="التاريخ" value={new Date(invoice.docDate).toLocaleDateString("ar-EG")} />
            <div>
              <div className="text-xs text-gray-500 mb-1">الحالة</div>
              <span className={`px-2 py-0.5 rounded-full text-xs ${DOC_STATUS_COLOR[invoice.status] ?? "bg-gray-100"}`}>
                {DOC_STATUS_LABEL[invoice.status] ?? invoice.status}
              </span>
            </div>
            <DetailField label="المستودع" value={whText} />
            <DetailField label="قيد GL" value={invoice.journalNumber ?? "—"} mono />
            <DetailField label="Stock Document" value={invoice.stockDocumentId ?? "—"} mono />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">الأسطر</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-right">#</th>
                    <th className="px-3 py-2 text-right">الوصف</th>
                    <th className="px-3 py-2 text-right">الكمية</th>
                    <th className="px-3 py-2 text-right">السعر</th>
                    <th className="px-3 py-2 text-right">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lines.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-gray-400">لا توجد أسطر</td>
                    </tr>
                  ) : (
                    lines.map((l) => (
                      <tr key={l.id ?? l.lineNumber}>
                        <td className="px-3 py-2 text-gray-500">{l.lineNumber}</td>
                        <td className="px-3 py-2">{l.description ?? "—"}</td>
                        <td className="px-3 py-2">{l.qty}</td>
                        <td className="px-3 py-2">{fmt(l.unitPrice)}</td>
                        <td className="px-3 py-2 font-medium">{fmt(l.lineTotal)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 px-4 py-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>الإجمالي الفرعي</span>
              <span>{fmt(invoice.subTotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>الضريبة</span>
              <span>{fmt(invoice.taxTotal)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-800 pt-1 border-t border-gray-200">
              <span>الإجمالي</span>
              <span>{fmt(invoice.grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 px-5 py-3">
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Printer size={14} />
            طباعة
          </button>
          {isDraft && (
            <>
              <button
                type="button"
                onClick={onPost}
                disabled={posting || cancelling}
                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
              >
                {posting ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                ترحيل
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={posting || cancelling}
                className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                {cancelling ? <RefreshCw size={14} className="animate-spin" /> : <X size={14} />}
                إلغاء
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="mr-auto rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
          >
            إغلاق
          </button>
        </div>
      </aside>
    </div>
  );
}

function DetailField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-sm text-gray-800 break-all ${mono ? "font-mono text-xs" : ""}`}>{value}</div>
    </div>
  );
}

function InvoicesPage({
  invoices, customers, warehouses, items, onRefresh
}: {
  invoices: SalesInvoiceDto[];
  customers: CustomerDto[];
  warehouses: WarehouseLookupDto[];
  items: ItemLookupDto[];
  onRefresh: () => void;
}) {
  const defaultWh = warehouses.find(w => w.isDefault && w.isActive)?.id
    ?? warehouses.find(w => w.isActive)?.id
    ?? "";

  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [posting, setPosting] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    docDate: new Date().toISOString().slice(0, 10),
    customerId: "",
    warehouseId: "",
    warehousePaste: "",
    taxTotal: "0",
    post: false,
  });
  const [lines, setLines] = useState<LineDraft[]>([
    { itemId: "", description: "", qty: "1", unitPrice: "0" },
  ]);

  const selectedInvoice =
    (selectedId && invoices.find((v) => v.id === selectedId)) || null;

  const openForm = () => {
    setForm({
      docDate: new Date().toISOString().slice(0, 10),
      customerId: "",
      warehouseId: defaultWh,
      warehousePaste: "",
      taxTotal: "0",
      post: false,
    });
    setLines([{ itemId: "", description: "", qty: "1", unitPrice: "0" }]);
    setShowForm(true);
  };

  const filtered = invoices.filter(
    (v) =>
      v.number.toLowerCase().includes(search.toLowerCase()) ||
      (v.customerName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (v.customerCode ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const resolvedWarehouseId = (): string => {
    if (warehouses.length > 0) return form.warehouseId.trim();
    return form.warehousePaste.trim();
  };

  const handlePost = async (id: string) => {
    setPosting(id);
    try {
      await api.postInvoice(id);
      toast.success("تم ترحيل الفاتورة بنجاح.");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "فشل الترحيل.");
    } finally {
      setPosting(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("هل أنت متأكد من إلغاء هذه الفاتورة؟")) return;
    setCancelling(id);
    try {
      await api.cancelInvoice(id);
      toast.success("تم إلغاء الفاتورة بنجاح.");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "فشل إلغاء الفاتورة.");
    } finally {
      setCancelling(null);
    }
  };

  const handleSave = async () => {
    if (!form.customerId) { toast.error("يجب اختيار العميل."); return; }

    const parsedLines = lines
      .map((l) => ({
        itemId: l.itemId.trim() || undefined,
        description: l.description.trim() || undefined,
        qty: parseFloat(l.qty),
        unitPrice: parseFloat(l.unitPrice),
      }))
      .filter((l) => l.qty > 0);

    if (parsedLines.length === 0) {
      toast.error("أضف سطراً واحداً على الأقل بكمية أكبر من صفر.");
      return;
    }

    const hasItemLines = parsedLines.some((l) => !!l.itemId);
    const warehouseId = resolvedWarehouseId();
    if (hasItemLines) {
      if (!warehouseId) {
        toast.error("يجب اختيار المستودع عند وجود أصناف في الأسطر (ItemId).");
        return;
      }
      if (!GUID_RE.test(warehouseId)) {
        toast.error("معرّف المستودع غير صالح (Guid).");
        return;
      }
    }

    setSaving(true);
    try {
      await api.createInvoice({
        docDate: form.docDate,
        customerId: form.customerId,
        warehouseId: warehouseId || undefined,
        taxTotal: parseFloat(form.taxTotal) || 0,
        post: form.post,
        lines: parsedLines,
      });
      toast.success("تم حفظ فاتورة البيع بنجاح.");
      setShowForm(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "فشل حفظ الفاتورة.");
    } finally {
      setSaving(false);
    }
  };

  const linesSubtotal = lines.reduce((s, l) => {
    const q = parseFloat(l.qty) || 0;
    const c = parseFloat(l.unitPrice) || 0;
    return s + q * c;
  }, 0);

  const activeItems = items.filter(i => i.isActive);
  const activeWarehouses = warehouses.filter(w => w.isActive);

  return (
    <div className="space-y-4 animate-page-in">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالرقم أو العميل…"
            className="w-full border border-gray-300 rounded-lg pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <span className="text-sm text-gray-500">{filtered.length} فاتورة</span>
        <button
          onClick={openForm}
          className="mr-auto flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} />
          فاتورة جديدة
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">فاتورة بيع جديدة</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">العميل *</label>
                <select value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— اختر —</option>
                  {customers.filter(s => s.isActive).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">التاريخ</label>
                <input type="date" value={form.docDate} onChange={e => setForm(f => ({ ...f, docDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                  <Warehouse size={12} /> المستودع {lines.some(l => l.itemId) ? "*" : ""}
                </label>
                {activeWarehouses.length > 0 ? (
                  <select value={form.warehouseId} onChange={e => setForm(f => ({ ...f, warehouseId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— اختر —</option>
                    {activeWarehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code}){w.isDefault ? " ★" : ""}</option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-1">
                    <input
                      value={form.warehousePaste}
                      onChange={e => setForm(f => ({ ...f, warehousePaste: e.target.value }))}
                      placeholder="الصق Warehouse Guid…"
                      className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="text-[11px] text-amber-600">قائمة المستودعات غير متاحة من Inventory — الصق الـ Guid يدوياً لترحيل المخزون.</p>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">الضريبة</label>
                <input type="number" value={form.taxTotal} onChange={e => setForm(f => ({ ...f, taxTotal: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2 flex items-end">
                <div className="text-sm text-gray-600">
                  الإجمالي الفرعي: <span className="font-semibold">{fmt(linesSubtotal)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">الأسطر</h3>
                <button
                  type="button"
                  onClick={() => setLines(ls => [...ls, { itemId: "", description: "", qty: "1", unitPrice: "0" }])}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  <Plus size={12} /> سطر
                </button>
              </div>
              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3">
                    {activeItems.length > 0 ? (
                      <select
                        value={line.itemId}
                        onChange={e => {
                          const id = e.target.value;
                          const item = activeItems.find(i => i.id === id);
                          setLines(ls => ls.map((l, i) => i === idx ? {
                            ...l,
                            itemId: id,
                            description: l.description || (item ? item.name : ""),
                          } : l));
                        }}
                        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">— صنف (اختياري) —</option>
                        {activeItems.map(it => (
                          <option key={it.id} value={it.id}>{it.code} — {it.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={line.itemId}
                        onChange={e => setLines(ls => ls.map((l, i) => i === idx ? { ...l, itemId: e.target.value } : l))}
                        placeholder="ItemId Guid"
                        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                  <div className="col-span-4">
                    <input
                      value={line.description}
                      onChange={e => setLines(ls => ls.map((l, i) => i === idx ? { ...l, description: e.target.value } : l))}
                      placeholder="الوصف"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      value={line.qty}
                      onChange={e => setLines(ls => ls.map((l, i) => i === idx ? { ...l, qty: e.target.value } : l))}
                      placeholder="الكمية"
                      className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={line.unitPrice}
                      onChange={e => setLines(ls => ls.map((l, i) => i === idx ? { ...l, unitPrice: e.target.value } : l))}
                      placeholder="السعر"
                      className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-1 text-xs text-gray-500 text-center">
                    {fmt((parseFloat(line.qty) || 0) * (parseFloat(line.unitPrice) || 0))}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setLines(ls => ls.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input id="postNow" type="checkbox" checked={form.post}
                onChange={e => setForm(f => ({ ...f, post: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-blue-600" />
              <label htmlFor="postNow" className="text-sm text-gray-600">ترحيل فوري</label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">إلغاء</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">لا توجد فواتير مسجّلة بعد.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="px-4 py-2 text-right">الرقم</th>
                  <th className="px-4 py-2 text-right">العميل</th>
                  <th className="px-4 py-2 text-right">الإجمالي</th>
                  <th className="px-4 py-2 text-right">الضريبة</th>
                  <th className="px-4 py-2 text-right">التاريخ</th>
                  <th className="px-4 py-2 text-right">الحالة</th>
                  <th className="px-4 py-2 text-right">قيد GL</th>
                  <th className="px-4 py-2 text-right">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setSelectedId(v.id)}
                    className={`hover:bg-blue-50/60 cursor-pointer transition-colors ${
                      selectedId === v.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="px-4 py-2 font-mono text-xs text-blue-700">{v.number}</td>
                    <td className="px-4 py-2">{v.customerName ?? v.customerCode ?? "—"}</td>
                    <td className="px-4 py-2 font-medium">{fmt(v.grandTotal)}</td>
                    <td className="px-4 py-2 text-gray-500">{fmt(v.taxTotal)}</td>
                    <td className="px-4 py-2 text-gray-500">{new Date(v.docDate).toLocaleDateString("ar-EG")}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${DOC_STATUS_COLOR[v.status] ?? "bg-gray-100"}`}>
                        {DOC_STATUS_LABEL[v.status] ?? v.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-500">{v.journalNumber ?? "—"}</td>
                    <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                      {v.status === 1 && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePost(v.id)}
                            disabled={posting === v.id || cancelling === v.id}
                            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 disabled:opacity-50"
                          >
                            {posting === v.id ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
                            ترحيل
                          </button>
                          <button
                            onClick={() => handleCancel(v.id)}
                            disabled={posting === v.id || cancelling === v.id}
                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                          >
                            {cancelling === v.id ? <RefreshCw size={12} className="animate-spin" /> : <X size={12} />}
                            إلغاء
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedInvoice && (
        <InvoiceDetailDrawer
          invoice={selectedInvoice}
          warehouses={warehouses}
          posting={posting === selectedInvoice.id}
          cancelling={cancelling === selectedInvoice.id}
          onClose={() => setSelectedId(null)}
          onPost={() => handlePost(selectedInvoice.id)}
          onCancel={() => handleCancel(selectedInvoice.id)}
          onPrint={() =>
            printInvoice(selectedInvoice, warehouseLabel(selectedInvoice.warehouseId, warehouses))
          }
        />
      )}
    </div>
  );
}
