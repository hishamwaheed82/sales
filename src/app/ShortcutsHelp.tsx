export function ShortcutsHelp({
  open,
  onClose,
  accentClass = "text-indigo-600",
}: {
  open: boolean;
  onClose: () => void;
  accentClass?: string;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/45 z-50 flex items-start justify-center pt-[18vh] backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-200 animate-page-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-help-title"
      >
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 id="shortcuts-help-title" className="text-sm font-semibold text-gray-800">
            اختصارات لوحة المفاتيح
          </h2>
          <kbd className="text-[10px] bg-gray-100 border border-gray-200 rounded px-1.5">Ctrl+/</kbd>
        </div>
        <ul className="px-5 py-3 space-y-2 text-sm text-gray-700">
          <li className="flex items-center justify-between gap-3">
            <span>فتح Command Palette</span>
            <kbd className="text-[10px] bg-gray-100 border border-gray-200 rounded px-1.5">Ctrl+K</kbd>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span>عرض الاختصارات</span>
            <kbd className="text-[10px] bg-gray-100 border border-gray-200 rounded px-1.5">Ctrl+/</kbd>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span>إغلاق النوافذ</span>
            <kbd className="text-[10px] bg-gray-100 border border-gray-200 rounded px-1.5">Esc</kbd>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span>إضافة الصفحة للمفضلة</span>
            <span className="text-xs text-gray-400">نجمة الشريط العلوي</span>
          </li>
        </ul>
        <div className="px-5 py-3 border-t border-gray-100 text-left">
          <button type="button" onClick={onClose} className={`text-xs ${accentClass} hover:underline`}>
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
