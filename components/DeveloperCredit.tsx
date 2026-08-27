import Link from "next/link";

/**
 * A small, unobtrusive "developed by" badge fixed to the corner of the
 * viewport. Rendered once per layout (dashboard / admin) so it stays put
 * at the true bottom-right of the screen instead of sitting in the normal
 * document flow, where it could end up crammed right under short pages.
 */
export function DeveloperCredit({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none fixed right-3 z-40 ${className}`}
      style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <Link
        href="https://www.facebook.com/rafahimn"
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-gray-200/80 bg-white/80 px-2.5 py-1 text-[10px] font-medium text-gray-400 shadow-sm backdrop-blur transition-colors hover:border-sky-200 hover:bg-white hover:text-sky-600 sm:px-3 sm:py-1.5 sm:text-[11px]"
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
        <span className="hidden sm:inline">Developed by </span>
        <span className="font-bold">RA Fahim</span>
      </Link>
    </div>
  );
}
