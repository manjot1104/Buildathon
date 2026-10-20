"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="font-display text-xl font-bold">Something went wrong</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || "A client-side error occurred. Try again."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
      >
        Try again
      </button>
    </div>
  );
}
