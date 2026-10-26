import { lazy, Suspense, type ComponentType } from "react";
export default function dynamic<P extends object>(
  load: () => Promise<ComponentType<P>>,
  options: { loading?: ComponentType; ssr?: boolean } = {},
) {
  const Lazy = lazy(async () => ({ default: await load() }));
  const Loading = options.loading;
  return function BrowserDynamic(props: P) {
    return (
      <Suspense fallback={Loading ? <Loading /> : null}>
        <Lazy {...props} />
      </Suspense>
    );
  };
}
