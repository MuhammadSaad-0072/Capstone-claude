import type { ReactNode } from "react";

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="border-l-4 border-loss bg-panel px-4 py-3">
      <p className="text-sm font-medium text-loss">That did not load</p>
      <p className="mt-1 text-sm">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-quiet mt-3">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="border border-dashed border-rule px-4 py-8 text-center">
      <p className="font-serif text-lg">{title}</p>
      {children && <div className="mt-2 text-sm text-muted">{children}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <span className="sr-only">Loading market data</span>
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-72 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
