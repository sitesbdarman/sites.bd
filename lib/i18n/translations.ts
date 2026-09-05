import type { Language } from "./LanguageContext";

export const homeText = {
  nav: {
    home: { en: "Home", bn: "হোম" },
    features: { en: "Features", bn: "ফিচার" },
    pricing: { en: "Pricing", bn: "মূল্য" },
    domainSearch: { en: "Domain Search", bn: "ডোমেইন সার্চ" },
    order: { en: "Order", bn: "অর্ডার" },
    contact: { en: "Contact", bn: "যোগাযোগ" },
  },
  hero: {
    title: { en: "Free SubDomain Provider", bn: "ফ্রি সাবডোমেইন প্রোভাইডার" },
    lead: {
      en: "Get your FREE subdomain instantly! Connect to any hosting, use with Blogger, and start your online journey with zero cost and instant activation.",
      bn: "এখনই আপনার ফ্রি সাবডোমেইন নিন! যেকোনো হোস্টিং-এর সাথে কানেক্ট করুন, Blogger-এ ব্যবহার করুন, আর জিরো কস্টে ইনস্ট্যান্ট অ্যাক্টিভেশন সহ আপনার অনলাইন যাত্রা শুরু করুন।",
    },
    ctaPrimary: { en: "Get Free Subdomain", bn: "ফ্রি সাবডোমেইন নিন" },
    ctaSecondary: { en: "See Features", bn: "ফিচারসমূহ দেখুন" },
    stats: [
      { value: { en: "100%", bn: "১০০%" }, label: { en: "Free Forever", bn: "চিরকাল ফ্রি" } },
      { value: { en: "Instant", bn: "ইনস্ট্যান্ট" }, label: { en: "Activation", bn: "অ্যাক্টিভেশন" } },
      { value: { en: "24/7", bn: "২৪/৭" }, label: { en: "DNS Updates", bn: "DNS আপডেট" } },
      { value: { en: "Any", bn: "যেকোনো" }, label: { en: "Hosting", bn: "হোস্টিং" } },
    ],
  },
  order: {
    title: { en: "Check Your Domain Name", bn: "আপনার ডোমেইন নাম চেক করুন" },
    subtitle: { en: "Instantly check if your desired domain is available.", bn: "আপনার পছন্দের ডোমেইনটি খালি আছে কিনা এখনই চেক করুন।" },
    placeholder: { en: "Enter your domain name (e.g. example.com)", bn: "আপনার ডোমেইন নাম লিখুন (যেমন example.com)" },
    button: { en: "Check Availability", bn: "এভেইলেবিলিটি চেক করুন" },
    example: { en: "Example: example.com / myshop.bd / arman-mia.sites.bd", bn: "উদাহরণ: example.com / myshop.bd / arman-mia.sites.bd" },
  },
  featuresHeading: {
    title: { en: "Why Choose SITES.BD?", bn: "কেন SITES.BD বেছে নেবেন?" },
    subtitle: {
      en: "A simple subdomain and hosting platform with instant setup and practical controls.",
      bn: "ইনস্ট্যান্ট সেটআপ ও সহজ কন্ট্রোল সহ একটি সহজ সাবডোমেইন ও হোস্টিং প্ল্যাটফর্ম।",
    },
  },
  features: [
    {
      title: { en: "100% Free", bn: "১০০% ফ্রি" },
      text: { en: "Get your subdomain completely free with no hidden charges, setup fees, or monthly costs.", bn: "কোনো হিডেন চার্জ, সেটআপ ফি বা মাসিক খরচ ছাড়াই সম্পূর্ণ ফ্রিতে আপনার সাবডোমেইন নিন।" },
      items: [
        { en: "No setup fees", bn: "কোনো সেটআপ ফি নেই" },
        { en: "No monthly charges", bn: "কোনো মাসিক চার্জ নেই" },
        { en: "No hidden costs", bn: "কোনো হিডেন খরচ নেই" },
      ],
    },
    {
      title: { en: "Instant Activation", bn: "ইনস্ট্যান্ট অ্যাক্টিভেশন" },
      text: { en: "Your subdomain can be created quickly with automatic DNS setup and immediate activation.", bn: "অটোমেটিক DNS সেটআপ ও তাৎক্ষণিক অ্যাক্টিভেশন সহ দ্রুত আপনার সাবডোমেইন তৈরি হয়ে যাবে।" },
      items: [
        { en: "Immediate creation", bn: "তাৎক্ষণিক তৈরি" },
        { en: "Automatic DNS setup", bn: "অটোমেটিক DNS সেটআপ" },
        { en: "Ready to use", bn: "ব্যবহারের জন্য প্রস্তুত" },
      ],
    },
    {
      title: { en: "Any Hosting Support", bn: "যেকোনো হোস্টিং সাপোর্ট" },
      text: { en: "Connect your subdomain to your own hosting, Blogger, or a hosting plan from this platform.", bn: "আপনার সাবডোমেইন নিজের হোস্টিং, Blogger, বা এই প্ল্যাটফর্মের হোস্টিং প্ল্যানের সাথে কানেক্ট করুন।" },
      items: [
        { en: "Custom hosting", bn: "কাস্টম হোস্টিং" },
        { en: "Blogger compatible", bn: "Blogger কম্প্যাটিবল" },
        { en: "Hosting available", bn: "হোস্টিং উপলব্ধ" },
      ],
    },
    {
      title: { en: "Easy Management", bn: "সহজ ম্যানেজমেন্ট" },
      text: { en: "Keep your domains, DNS records, orders, invoices and services in one simple dashboard.", bn: "আপনার ডোমেইন, DNS রেকর্ড, অর্ডার, ইনভয়েস ও সার্ভিস একটি সহজ ড্যাশবোর্ডে রাখুন।" },
      items: [
        { en: "Easy order process", bn: "সহজ অর্ডার প্রসেস" },
        { en: "DNS management", bn: "DNS ম্যানেজমেন্ট" },
        { en: "User dashboard", bn: "ইউজার ড্যাশবোর্ড" },
      ],
    },
    {
      title: { en: "Secure & Reliable", bn: "নিরাপদ ও নির্ভরযোগ্য" },
      text: { en: "Professional DNS infrastructure, protected accounts and clear service management.", bn: "প্রফেশনাল DNS ইনফ্রাস্ট্রাকচার, সুরক্ষিত অ্যাকাউন্ট এবং স্বচ্ছ সার্ভিস ম্যানেজমেন্ট।" },
      items: [
        { en: "Secure DNS", bn: "নিরাপদ DNS" },
        { en: "Protected account", bn: "সুরক্ষিত অ্যাকাউন্ট" },
        { en: "Support when needed", bn: "প্রয়োজনে সাপোর্ট" },
      ],
    },
    {
      title: { en: "For Everyone", bn: "সবার জন্য" },
      text: { en: "Built for beginners and developers alike. You do not need advanced technical knowledge to start.", bn: "নতুন ও ডেভেলপার — সবার জন্যই তৈরি। শুরু করতে কোনো টেকনিক্যাল জ্ঞানের দরকার নেই।" },
      items: [
        { en: "Beginner friendly", bn: "বিগিনার ফ্রেন্ডলি" },
        { en: "Developer ready", bn: "ডেভেলপার রেডি" },
        { en: "Simple controls", bn: "সহজ কন্ট্রোল" },
      ],
    },
  ],
  howItWorks: {
    title: { en: "How It Works", bn: "যেভাবে কাজ করে" },
    subtitle: { en: "Get your free subdomain in just 3 simple steps.", bn: "মাত্র ৩টি সহজ ধাপে আপনার ফ্রি সাবডোমেইন নিন।" },
    steps: [
      { title: { en: "Choose Your Subdomain", bn: "আপনার সাবডোমেইন বেছে নিন" }, text: { en: "Enter your desired subdomain name and check availability instantly.", bn: "আপনার পছন্দের সাবডোমেইন নাম লিখুন এবং এখনই এভেইলেবিলিটি চেক করুন।" } },
      { title: { en: "Instant Creation", bn: "ইনস্ট্যান্ট তৈরি" }, text: { en: "Create your subdomain with automatic DNS configuration and immediate activation.", bn: "অটোমেটিক DNS কনফিগারেশন ও তাৎক্ষণিক অ্যাক্টিভেশন সহ আপনার সাবডোমেইন তৈরি করুন।" } },
      { title: { en: "Connect & Launch", bn: "কানেক্ট করে লঞ্চ করুন" }, text: { en: "Connect it to your hosting or use it with Blogger and launch your website.", bn: "এটি আপনার হোস্টিং-এর সাথে কানেক্ট করুন বা Blogger-এ ব্যবহার করে আপনার ওয়েবসাইট লঞ্চ করুন।" } },
    ],
  },
  footer: {
    tagline: { en: "A simple home for free subdomains, domains, hosting, DNS management and support.", bn: "ফ্রি সাবডোমেইন, ডোমেইন, হোস্টিং, DNS ম্যানেজমেন্ট ও সাপোর্টের জন্য একটি সহজ প্ল্যাটফর্ম।" },
    services: { en: "Services", bn: "সার্ভিস" },
    support: { en: "Support", bn: "সাপোর্ট" },
    platform: { en: "Platform", bn: "প্ল্যাটফর্ম" },
    links: {
      freeSubdomains: { en: "Free Subdomains", bn: "ফ্রি সাবডোমেইন" },
      domainSearch: { en: "Domain Search", bn: "ডোমেইন সার্চ" },
      whois: { en: "WHOIS Lookup", bn: "WHOIS লুকআপ" },
      dnsManagement: { en: "DNS Management", bn: "DNS ম্যানেজমেন্ট" },
      contactUs: { en: "Contact Us", bn: "যোগাযোগ করুন" },
      supportTickets: { en: "Support Tickets", bn: "সাপোর্ট টিকেট" },
      customerLogin: { en: "Customer Login", bn: "কাস্টমার লগইন" },
      createAccount: { en: "Create Account", bn: "অ্যাকাউন্ট তৈরি করুন" },
      hosting: { en: "Hosting", bn: "হোস্টিং" },
      cart: { en: "Cart", bn: "কার্ট" },
      dashboard: { en: "Dashboard", bn: "ড্যাশবোর্ড" },
    },
    rights: { en: "All rights reserved.", bn: "সর্বস্বত্ব সংরক্ষিত।" },
  },
} as const;

export const whyChooseText = {
  title: { en: "Why Choose sites.bd?", bn: "কেন sites.bd বেছে নেবেন?" },
  subtitle: { en: "Revolutionary subdomain system with instant creation and unlimited possibilities", bn: "ইনস্ট্যান্ট তৈরি এবং অসীম সম্ভাবনাসহ আধুনিক সাবডোমেইন সিস্টেম" },
  cards: [
    { title: { en: "100% Free", bn: "১০০% ফ্রি" }, text: { en: "Get your subdomain completely free with no hidden charges, no setup fees, and no monthly costs.", bn: "কোনো হিডেন চার্জ, সেটআপ ফি বা মাসিক খরচ ছাড়াই সম্পূর্ণ ফ্রিতে আপনার সাবডোমেইন নিন।" }, items: [{ en: "No Setup Fees", bn: "কোনো সেটআপ ফি নেই" }, { en: "No Monthly Charges", bn: "কোনো মাসিক চার্জ নেই" }, { en: "No Hidden Costs", bn: "কোনো হিডেন খরচ নেই" }], tone: "blue", icon: "gift" },
    { title: { en: "Instant Activation", bn: "ইনস্ট্যান্ট অ্যাক্টিভেশন" }, text: { en: "Your subdomain is created and activated instantly. No waiting, no approval process.", bn: "আপনার সাবডোমেইন তাৎক্ষণিকভাবে তৈরি ও অ্যাক্টিভেট হবে। কোনো অপেক্ষা বা অ্যাপ্রুভাল প্রক্রিয়া নেই।" }, items: [{ en: "Immediate Creation", bn: "তাৎক্ষণিক তৈরি" }, { en: "Auto DNS Setup", bn: "অটো DNS সেটআপ" }, { en: "Ready to Use", bn: "ব্যবহারের জন্য প্রস্তুত" }], tone: "green", icon: "bolt" },
    { title: { en: "Any Hosting Support", bn: "যেকোনো হোস্টিং সাপোর্ট" }, text: { en: "Use with any hosting provider, Blogger, or our own hosting. Complete flexibility.", bn: "যেকোনো হোস্টিং প্রোভাইডার, Blogger অথবা আমাদের নিজস্ব হোস্টিংয়ের সাথে ব্যবহার করুন। সম্পূর্ণ স্বাধীনতা।" }, items: [{ en: "Custom Hosting", bn: "কাস্টম হোস্টিং" }, { en: "Blogger Compatible", bn: "Blogger কম্প্যাটিবল" }, { en: "Our Hosting Available", bn: "আমাদের হোস্টিংও আছে" }], tone: "purple", icon: "server" },
    { title: { en: "Easy Management", bn: "সহজ ম্যানেজমেন্ট" }, text: { en: "Simple order process with automatic DNS updates and easy subdomain management.", bn: "অটোমেটিক DNS আপডেট এবং সহজ সাবডোমেইন ম্যানেজমেন্টসহ সহজ অর্ডার প্রসেস।" }, items: [{ en: "Easy Order Process", bn: "সহজ অর্ডার প্রসেস" }, { en: "Auto DNS Updates", bn: "অটো DNS আপডেট" }, { en: "User Dashboard", bn: "ইউজার ড্যাশবোর্ড" }], tone: "orange", icon: "settings" },
    { title: { en: "Secure & Reliable", bn: "নিরাপদ ও নির্ভরযোগ্য" }, text: { en: "Professional DNS infrastructure with 99.9% uptime and secure subdomain management.", bn: "৯৯.৯% আপটাইম এবং নিরাপদ সাবডোমেইন ম্যানেজমেন্টসহ প্রফেশনাল DNS ইনফ্রাস্ট্রাকচার।" }, items: [{ en: "99.9% Uptime", bn: "৯৯.৯% আপটাইম" }, { en: "Secure DNS", bn: "নিরাপদ DNS" }, { en: "Professional Support", bn: "প্রফেশনাল সাপোর্ট" }], tone: "red", icon: "shield" },
    { title: { en: "For Everyone", bn: "সবার জন্য" }, text: { en: "Perfect for beginners and developers alike. No technical knowledge required.", bn: "বিগিনার ও ডেভেলপার—সবার জন্য উপযুক্ত। কোনো টেকনিক্যাল জ্ঞান প্রয়োজন নেই।" }, items: [{ en: "Beginner Friendly", bn: "বিগিনার ফ্রেন্ডলি" }, { en: "Developer Ready", bn: "ডেভেলপার রেডি" }, { en: "No Tech Skills Needed", bn: "টেকনিক্যাল স্কিল দরকার নেই" }], tone: "teal", icon: "users" },
  ],
} as const;

export const domainSearchText = {
  title: { en: "Check Your Domain Name", bn: "আপনার ডোমেইন নাম চেক করুন" },
  subtitle: { en: "Search again here or view the domain you searched from the homepage.", bn: "এখানে আবার সার্চ করুন অথবা হোমপেজ থেকে সার্চ করা ডোমেইনটি দেখুন।" },
  searchPlaceholder: { en: "example.com", bn: "example.com" },
  searchButton: { en: "Search", bn: "সার্চ" },
  searching: { en: "Searching...", bn: "সার্চ করা হচ্ছে..." },
  helperText: { en: "Search up to 5 domains at once, separated by commas or spaces.", bn: "একসাথে সর্বোচ্চ ৫টি ডোমেইন সার্চ করুন, কমা বা স্পেস দিয়ে আলাদা করে।" },
  backToHome: { en: "← Back to homepage", bn: "← হোমপেজে ফিরে যান" },
  recent: { en: "Recent:", bn: "সাম্প্রতিক:" },
  available: { en: "Available", bn: "উপলব্ধ" },
  unavailable: { en: "Unavailable", bn: "অনুপলব্ধ" },
  claim: { en: "Claim", bn: "ক্লেইম করুন" },
  addedToCart: { en: "Added to cart", bn: "কার্টে যোগ হয়েছে" },
  whois: { en: "Whois", bn: "Whois" },
  seeSimilar: { en: "See similar available names →", bn: "একই রকম উপলব্ধ নাম দেখুন →" },
  seeMoreOptions: { en: "See more domain options →", bn: "আরও ডোমেইন অপশন দেখুন →" },
  checkingSimilar: { en: "Checking similar names for", bn: "একই রকম নাম চেক করা হচ্ছে:" },
  noSimilar: { en: "No similar names available right now.", bn: "এই মুহূর্তে একই রকম কোনো নাম উপলব্ধ নেই।" },
  recommended: { en: "Recommended", bn: "প্রস্তাবিত" },
  alsoConsider: { en: "You might also like", bn: "আপনার আরও পছন্দ হতে পারে" },
  noResults: { en: "No results found.", bn: "কোনো ফলাফল পাওয়া যায়নি।" },
  mockNotice: {
    en: "Availability shown below is placeholder demo data — no real registry has been checked yet.",
    bn: "নিচে দেখানো এভেইলেবিলিটি ডেমো ডেটা — এখনো কোনো রিয়েল রেজিস্ট্রি চেক করা হয়নি।",
  },
} as const;

export function tr<T extends { en: string; bn: string }>(entry: T, lang: Language): string {
  return entry[lang];
}
