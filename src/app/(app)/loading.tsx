/** Skeleton umesto spinnera — manje "flash-a" pri brzim navigacijama, instant feedback pri sporim. */
export default function AppLoading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="space-y-3">
        <div className="h-3 w-40 bg-ink-300" />
        <div className="h-9 w-72 bg-ink-300" />
        <div className="h-3 w-56 bg-ink-300" />
      </div>
      <div className="h-12 w-full bg-ink-200" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-32 bg-ink-200" />
        <div className="h-32 bg-ink-200" />
        <div className="h-32 bg-ink-200" />
      </div>
    </div>
  );
}
