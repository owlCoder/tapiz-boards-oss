import type { AnchorHTMLAttributes, MouseEvent } from "react";
export default function Link({
  href,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const internal = href.startsWith("/");
  return (
    <a
      {...props}
      href={internal ? `#${href}` : href}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);
      }}
    />
  );
}
