import { useState, useEffect, useCallback } from "react";
import { Toaster, toast } from "sonner";
import {
  LayoutDashboard, Truck, FileText,
  ChevronLeft, Bell, User, LogOut, Plus, Check, X,
  RefreshCw, Search, Menu, TrendingUp, ShoppingCart, Trash2,
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
  type SupplierDto,
  type PurchaseInvoiceDto,
  type SessionTenant,
  type SessionUser,
} from "./api";
import { LoginScreen } from "./LoginScreen";

// ─── Types ──────────────────────────────────────────────────────────────────
type Page = "dashboard" | "suppliers" | "invoices";

const DOC_STATUS_LABEL: Record<number, string> = {
  1: "مسودة",
  2: "مرحّل",
};
const DOC_STATUS_COLOR: Record<number, string> = {
  1: "bg-yellow-100 text-yellow-800",
  2: "bg-green-100 text-green-800",
};

const fmt = (n: number) => n.toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const NAV_ITEMS: { page: Page; label: string; icon: React.ReactNode }[] = [
  { page: "dashboard", label: "لوحة التحكم", icon: <LayoutDashboard size={18} /> },
  { page: "suppliers", label: "الموردون",     icon: <Truck size={18} /> },
  { page: "invoices",  label: "فواتير الشراء", icon: <FileText size={18} /> },
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
        <LoginScreen onLogin={handleLogin} appName="نظام المشتريات" />
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
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <ShoppingCart size={16} />
          </div>
          {sidebarOpen && <span className="text-sm font-bold leading-tight">المشتريات</span>}
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
                  ? "bg-orange-600 text-white"
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
              {page === "suppliers" && (
                <SuppliersPage
                  suppliers={bootstrap?.suppliers ?? []}
                  onRefresh={loadBootstrap}
                />
              )}
              {page === "invoices" && (
                <InvoicesPage
                  invoices={bootstrap?.recentInvoices ?? []}
                  suppliers={bootstrap?.suppliers ?? []}
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
      title: "الموردون",
      value: bootstrap.suppliers.length.toLocaleString("ar-EG"),
      icon: <Truck size={22} className="text-orange-500" />,
      bg: "bg-orange-50",
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
      icon: <TrendingUp size={22} className="text-blue-500" />,
      bg: "bg-blue-50",
    },
    {
      title: "آخر الفواتير",
      value: bootstrap.recentInvoices.length.toLocaleString("ar-EG"),
      icon: <ShoppingCart size={22} className="text-purple-500" />,
      bg: "bg-purple-50",
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
          <h2 className="text-sm font-semibold text-gray-700">آخر فواتير الشراء</h2>
        </div>
        {bootstrap.recentInvoices.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">لا توجد فواتير مسجّلة بعد.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="px-4 py-2 text-right">رقم</th>
                <th className="px-4 py-2 text-right">المورد</th>
                <th className="px-4 py-2 text-right">الإجمالي</th>
                <th className="px-4 py-2 text-right">التاريخ</th>
                <th className="px-4 py-2 text-right">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bootstrap.recentInvoices.slice(0, 8).map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs">{v.number}</td>
                  <td className="px-4 py-2">{v.supplierName ?? v.supplierCode ?? "—"}</td>
                  <td className="px-4 py-2 font-medium">{fmt(v.grandTotal)}</td>
                  <td className="px-4 py-2 text-gray-500">{new Date(v.docDate).toLocaleDateString("ar-EG")}</td>
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
// Suppliers
// ─────────────────────────────────────────────────────────────────────────────
function SuppliersPage({ suppliers, onRefresh }: { suppliers: SupplierDto[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: "", name: "" });

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("الكود والاسم مطلوبان.");
      return;
    }
    setSaving(true);
    try {
      await api.createSupplier({
        code: form.code.trim(),
        name: form.name.trim(),
        isActive: true,
      });
      toast.success("تم إضافة المورد بنجاح.");
      setShowForm(false);
      setForm({ code: "", name: "" });
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "فشل حفظ المورد.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{suppliers.length} مورد</span>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-orange-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus size={15} />
          مورد جديد
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">إضافة مورد جديد</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">الكود *</label>
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">الاسم *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">إلغاء</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50">
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {suppliers.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm bg-white rounded-xl border border-gray-200">
          لا يوجد موردون مسجّلون بعد.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
              <div className="p-2.5 bg-orange-50 rounded-lg">
                <Truck size={20} className="text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-800">{s.name}</div>
                <div className="text-xs text-gray-400 mt-0.5 font-mono">{s.code}</div>
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
// Invoices (create + post)
// ─────────────────────────────────────────────────────────────────────────────
type LineDraft = { description: string; qty: string; unitCost: string };

function InvoicesPage({
  invoices, suppliers, onRefresh
}: {
  invoices: PurchaseInvoiceDto[];
  suppliers: SupplierDto[];
  onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [posting, setPosting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    docDate: new Date().toISOString().slice(0, 10),
    supplierId: "",
    taxTotal: "0",
    post: false,
  });
  const [lines, setLines] = useState<LineDraft[]>([
    { description: "", qty: "1", unitCost: "0" },
  ]);

  const filtered = invoices.filter(
    (v) =>
      v.number.toLowerCase().includes(search.toLowerCase()) ||
      (v.supplierName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (v.supplierCode ?? "").toLowerCase().includes(search.toLowerCase())
  );

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

  const handleSave = async () => {
    if (!form.supplierId) { toast.error("يجب اختيار المورد."); return; }
    const parsedLines = lines
      .map((l) => ({
        description: l.description.trim() || undefined,
        qty: parseFloat(l.qty),
        unitCost: parseFloat(l.unitCost),
      }))
      .filter((l) => l.qty > 0);

    if (parsedLines.length === 0) {
      toast.error("أضف سطراً واحداً على الأقل بكمية أكبر من صفر.");
      return;
    }

    setSaving(true);
    try {
      await api.createInvoice({
        docDate: form.docDate,
        supplierId: form.supplierId,
        taxTotal: parseFloat(form.taxTotal) || 0,
        post: form.post,
        lines: parsedLines,
      });
      toast.success("تم حفظ فاتورة الشراء بنجاح.");
      setShowForm(false);
      setForm({
        docDate: new Date().toISOString().slice(0, 10),
        supplierId: "",
        taxTotal: "0",
        post: false,
      });
      setLines([{ description: "", qty: "1", unitCost: "0" }]);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "فشل حفظ الفاتورة.");
    } finally {
      setSaving(false);
    }
  };

  const linesSubtotal = lines.reduce((s, l) => {
    const q = parseFloat(l.qty) || 0;
    const c = parseFloat(l.unitCost) || 0;
    return s + q * c;
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالرقم أو المورد…"
            className="w-full border border-gray-300 rounded-lg pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <span className="text-sm text-gray-500">{filtered.length} فاتورة</span>
        <button
          onClick={() => setShowForm(true)}
          className="mr-auto flex items-center gap-2 bg-orange-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus size={15} />
          فاتورة جديدة
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">فاتورة شراء جديدة</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">المورد *</label>
                <select value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">— اختر —</option>
                  {suppliers.filter(s => s.isActive).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">التاريخ</label>
                <input type="date" value={form.docDate} onChange={e => setForm(f => ({ ...f, docDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">الضريبة</label>
                <input type="number" value={form.taxTotal} onChange={e => setForm(f => ({ ...f, taxTotal: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div className="flex items-end">
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
                  onClick={() => setLines(ls => [...ls, { description: "", qty: "1", unitCost: "0" }])}
                  className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800"
                >
                  <Plus size={12} /> سطر
                </button>
              </div>
              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <input
                      value={line.description}
                      onChange={e => setLines(ls => ls.map((l, i) => i === idx ? { ...l, description: e.target.value } : l))}
                      placeholder="الوصف"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={line.qty}
                      onChange={e => setLines(ls => ls.map((l, i) => i === idx ? { ...l, qty: e.target.value } : l))}
                      placeholder="الكمية"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      value={line.unitCost}
                      onChange={e => setLines(ls => ls.map((l, i) => i === idx ? { ...l, unitCost: e.target.value } : l))}
                      placeholder="التكلفة"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="col-span-1 text-xs text-gray-500 text-center">
                    {fmt((parseFloat(line.qty) || 0) * (parseFloat(line.unitCost) || 0))}
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
                className="w-4 h-4 rounded border-gray-300 text-orange-600" />
              <label htmlFor="postNow" className="text-sm text-gray-600">ترحيل فوري</label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">إلغاء</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50">
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
                  <th className="px-4 py-2 text-right">المورد</th>
                  <th className="px-4 py-2 text-right">الإجمالي</th>
                  <th className="px-4 py-2 text-right">الضريبة</th>
                  <th className="px-4 py-2 text-right">التاريخ</th>
                  <th className="px-4 py-2 text-right">الحالة</th>
                  <th className="px-4 py-2 text-right">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs text-orange-700">{v.number}</td>
                    <td className="px-4 py-2">{v.supplierName ?? v.supplierCode ?? "—"}</td>
                    <td className="px-4 py-2 font-medium">{fmt(v.grandTotal)}</td>
                    <td className="px-4 py-2 text-gray-500">{fmt(v.taxTotal)}</td>
                    <td className="px-4 py-2 text-gray-500">{new Date(v.docDate).toLocaleDateString("ar-EG")}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${DOC_STATUS_COLOR[v.status] ?? "bg-gray-100"}`}>
                        {DOC_STATUS_LABEL[v.status] ?? v.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {v.status === 1 && (
                        <button
                          onClick={() => handlePost(v.id)}
                          disabled={posting === v.id}
                          className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 disabled:opacity-50"
                        >
                          {posting === v.id ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
                          ترحيل
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
