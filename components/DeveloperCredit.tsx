import Link from "next/link";

/**
 * A small, unobtrusive "developed by" badge fixed to the corner of the
 * viewport. Rendered once per layout (dashboard / admin) so it stays put
 * at the true bottom-right of the screen instead of sitting in the normal
 * document flow, where it could end up crammed right under short pages.
 */
export function DeveloperCredit({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none fixed bottom-3 right-3 z-40 ${className}`}>
      <Link
        href="https://www.facebook.com/rafahimn"
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-gray-200/80 bg-white/80 px-3 py-1.5 text-[11px] font-medium text-gray-400 shadow-sm backdrop-blur transition-colors hover:border-sky-200 hover:bg-white hover:text-sky-600"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
        Developed by <span className="font-bold">RA Fahim</span>
      </Link>
    </div>
  );
}
