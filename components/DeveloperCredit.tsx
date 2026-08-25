import Link from "next/link";

export function DeveloperCredit({ className = "" }: { className?: string }) {
  return (
    <div className={`text-sm text-gray-400 ${className}`}>
      Developed by{" "}
      <Link
        href="https://www.facebook.com/rafahimn"
        target="_blank"
        rel="noopener noreferrer"
        className="font-extrabold text-sky-400 no-underline transition-colors hover:text-sky-300"
      >
        RA Fahim
      </Link>
    </div>
  );
}
