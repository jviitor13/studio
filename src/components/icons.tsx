import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M10 18h4" />
      <path d="M12 18v-3.33c0-.47.24-.9.64-1.15l1.63-.94c.2-.12.44-.12.64 0l1.63.94c.4.25.64.68.64 1.15V18" />
      <path d="M8 18V9.5c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2V18" />
      <path d="M8 18h-2c-1.1 0-2-.9-2-2v-3.5c0-1.1.9-2 2-2h1.5" />
      <path d="m22 7-9 9L9 12" />
      <circle cx="8" cy="18" r="2" />
      <circle cx="16" cy="18" r="2" />
    </svg>
  );
}
