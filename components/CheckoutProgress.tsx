import Link from "next/link";

const steps = [
  ["01", "Hosting", "/checkout/hosting"],
  ["02", "Add-ons", "/checkout/addons"],
  ["03", "Review", "/checkout/review"],
  ["04", "Payment", "/checkout/payment"],
] as const;

export function CheckoutProgress({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <div className="surface overflow-hidden p-3 sm:p-4">
      <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
        {steps.map(([number, label, href], index) => {
          const step = index + 1;
          const active = step === current;
          const complete = step < current;
          return (
            <Link
              key={number}
              href={step <= current ? href : "#"}
              aria-current={active ? "step" : undefined}
              className={`group rounded-xl px-2 py-2.5 text-center transition sm:px-3 ${
                active ? "bg-blue-50 text-blue-700" : complete ? "text-emerald-700 hover:bg-emerald-50" : "text-slate-400"
              }`}
            >
              <span className={`mx-auto grid h-7 w-7 place-items-center rounded-full text-[10px] font-black ${active ? "bg-blue-600 text-white" : complete ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                {complete ? "✓" : number}
              </span>
              <span className="mt-1.5 block truncate text-[10px] font-black uppercase tracking-[.08em] sm:text-xs">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
