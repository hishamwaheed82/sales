import { useState } from "react";
import { Wallet, Eye, EyeOff } from "lucide-react";

export function LoginScreen({
  onLogin,
  appName = "نظام الخزينة",
}: {
  onLogin: (creds: { username: string; password: string; tenantCode?: string }) => Promise<void>;
  appName?: string;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tenantCode, setTenantCode] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("يرجى إدخال اسم المستخدم وكلمة المرور.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onLogin({ username: username.trim(), password, tenantCode: tenantCode.trim() || undefined });
    } catch (err: any) {
      setError(err.message || "فشل تسجيل الدخول.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        fontFamily: "'Cairo', 'Segoe UI', sans-serif",
        background: "linear-gradient(160deg, #0B1A2E 0%, #122846 45%, #0D2340 100%)"
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <Wallet size={28} className="text-white" />
          </div>
          <p className="text-xs text-gray-400 tracking-widest uppercase">Soft Plan</p>
          <h1 className="mt-1 text-lg font-bold text-gray-800">{appName}</h1>
          <p className="text-xs text-emerald-700 mt-1 font-medium">Treasury</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="admin أو user@example.com"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent pl-9"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">المستأجر (اتركه فارغاً لـ Host)</label>
            <input
              type="text"
              value={tenantCode}
              onChange={(e) => setTenantCode(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="مثال: ALMAALY"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors mt-2"
          >
            {loading ? "جاري الدخول…" : "دخول"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Soft Plan — Treasury
        </p>
      </div>
    </div>
  );
}
