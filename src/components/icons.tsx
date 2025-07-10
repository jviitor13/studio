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
      <path d="M10 17h4" />
      <path d="M6 17h-2" />
      <path d="m21.17 14.83-1.17-1.17" />
      <path d="M12 17H8" />
      <path d="M18 17h-2" />
      <path d="M4 17H2" />
      <path d="M7 17a1 1 0 0 0 1-1V8.5A2.5 2.5 0 0 1 10.5 6H12" />
      <path d="M14 6h5.5a2.5 2.5 0 0 1 2.5 2.5V17a1 1 0 0 1-1 1h-1" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="18" cy="17" r="2" />
      <circle cx="15" cy="8" r="4" />
    </svg>
  );
}