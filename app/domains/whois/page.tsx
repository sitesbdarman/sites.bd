import { Suspense } from "react";
import WhoisContent from "./whois-content";

export default function WhoisPage() {
  return (
    <Suspense fallback={null}>
      <WhoisContent />
    </Suspense>
  );
}
