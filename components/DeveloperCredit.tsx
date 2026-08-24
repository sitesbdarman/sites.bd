import Link from "next/link";

export function DeveloperCredit() {
  return (
    <div className="border-b border-blue-100 bg-white px-5 py-2 text-center shadow-sm">
      <p className="text-xs font-semibold tracking-wide text-gray-500 sm:text-sm">
        Developed by{" "}
        <Link
          href="https://www.facebook.com/rafahimn"
          target="_blank"
          rel="noopener noreferrer"
          className="font-extrabold text-sky-500 underline decoration-sky-300 underline-offset-2 transition hover:text-sky-600"
        >
          RA Fahim
        </Link>
      </p>
    </div>
  );
}
