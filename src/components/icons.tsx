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
      <path d="M8 6v10" />
      <path d="M16 6v10" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M4 12a10 10 0 0 0 16 0H4Z" />
      <path d="M4 12V8" />
      <path d="M20 12V8" />
      <path d="m14 16.5-4-3" />
      <path d="m10 16.5 4-3" />
    </svg>
  );
}
