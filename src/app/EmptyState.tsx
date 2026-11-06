import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="py-16 px-6 text-center bg-white rounded-xl border border-dashed border-gray-200">
      {icon ? (
        <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
          {icon}
        </div>
      ) : null}
      <div className="text-sm font-medium text-gray-600">{title}</div>
      {description ? <div className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">{description}</div> : null}
    </div>
  );
}
