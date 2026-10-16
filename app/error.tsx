"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="max-w-prose space-y-3">
      <h1 className="text-2xl">Something went wrong</h1>
      <p className="text-sm text-muted">The page hit an unexpected problem. Your portfolio data is not affected. Try loading it again.</p>
      <button type="button" className="btn btn-primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
