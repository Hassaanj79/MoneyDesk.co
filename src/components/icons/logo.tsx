import { cn } from "@/lib/utils";
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
      className={cn("size-6", props.className)}
      {...props}
    >
      <circle cx="12" cy="12" r="10" fill="hsl(var(--primary))" stroke="none" />
      <path
        d="M8 15l2-3 2 3 2-3 2 3"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="2"
      />
    </svg>
  );
}