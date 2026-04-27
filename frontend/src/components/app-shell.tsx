import { FileText } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/70 backdrop-blur">
        <div className={cn("container flex h-14 items-center justify-between")}>
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-indigo-600 text-white shadow-sm">
              <FileText className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">CV Report</div>
              <div className="text-xs text-slate-500">Evidence-based career feedback</div>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Upload • Analyze • Improve
          </div>
        </div>
      </header>
      <main className="container py-10">{children}</main>
    </div>
  );
}

