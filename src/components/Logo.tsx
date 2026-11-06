// The Voxis mark: a white shape on black. The same drawing as src/app/icon.svg (the browser/tab icon); here the
// corners are rounded because inside a page a hard black square looks like a mistake.
// `decorative` hides it from screen readers when the word "Voxis" is already written next to it.
export function Logo({ size = 28, decorative = false, className = "" }: { size?: number; decorative?: boolean; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": "Voxis" })}
    >
      <rect width="512" height="512" rx="112" fill="#000" />
      <g fill="#fff">
        <path d="M256 120 304 150 256 180 208 150Z" />
        <path d="M160 174 256 234 352 174 352 228 256 288 160 228Z" />
        <path d="M160 270 205 242 205 302 160 330Z" />
        <path d="M352 270 307 242 307 302 352 330Z" />
      </g>
    </svg>
  );
}
