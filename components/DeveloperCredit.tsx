import Link from "next/link";

export function DeveloperCredit() {
  return (
    <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-gray-400">
      Developed by{" "}
      <Link
        href="https://www.facebook.com/rafahimn"
        target="_blank"
        rel="noopener noreferrer"
        className="font-extrabold text-sky-400 underline decoration-sky-400/50 underline-offset-4 transition-colors hover:text-sky-300"
      >
        RA Fahim
      </Link>
    </div>
  );
}
