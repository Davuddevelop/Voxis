import type { ReactNode } from "react";

type GrainFrameProps = {
  className?: string;
  children?: ReactNode;
};

// A frame with a grainy light-leak behind its content. The grain sits on its own aria-hidden layer
// (see .grain in globals.css) so the CSS filter never touches the content in front of it.
// "isolate" + "-z-10" keep that layer inside the frame instead of sliding behind the page.
export function GrainFrame({ className = "", children }: GrainFrameProps) {
  return (
    <div className={`relative isolate overflow-hidden rounded-xl bg-black ${className}`}>
      <div aria-hidden className="grain absolute inset-0 -z-10" />
      {children}
    </div>
  );
}
