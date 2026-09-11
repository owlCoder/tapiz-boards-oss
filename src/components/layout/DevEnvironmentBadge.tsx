export function DevEnvironmentBadge() {
  if (process.env.NEXT_PUBLIC_VERCEL_ENV !== "preview") {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-80 select-none rounded bg-yellow-400 px-2 py-0.5 text-xs font-bold text-yellow-900 shadow">
      DEV
    </div>
  );
}
