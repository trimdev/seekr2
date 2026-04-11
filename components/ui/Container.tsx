import type { ReactNode } from "react";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`w-full max-w-5xl mx-auto px-3 sm:px-5 ${className}`}>
      {children}
    </div>
  );
}
