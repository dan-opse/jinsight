import { ReactNode } from "react";

export default function Nav({ children }: { children?: ReactNode }) {
  return (
    <nav className="border-b border-violet-100 bg-white px-6 py-3.5 flex items-center justify-between">
      <span className="font-serif font-semibold text-violet-700 text-lg tracking-tight">
        Jinsight
      </span>
      {children && (
        <div className="flex items-center gap-5 text-sm">{children}</div>
      )}
    </nav>
  );
}
