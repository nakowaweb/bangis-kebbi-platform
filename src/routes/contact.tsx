import { createFileRoute } from "@tanstack/react-router";

import { ContactSection } from "@/components/platform-sections";
import { pageHead } from "@/lib/seo";
import { ContactActions } from "@/components/contact-actions";
import { SectionShell } from "@/components/platform-sections";
import { useLanguage } from "@/lib/language";

export const Route = createFileRoute("/contact")({
  head: ({ match }) =>
    pageHead({ search: match.search,
      title: "Contact Bangis Kebbi — Hire Me or Start a Conversation",
      description:
        "Contact Abubakar Alhaji Abubakar for AI-assisted web design, web development, UI/UX, digital business support and community platform work.",
      path: "/contact",
    }),
  component: ContactPage,
});

function ContactPage() {
  const { language } = useLanguage();
  const copy = language === "ar" ? { eyebrow: "تواصل", title: "ابدأ محادثة واضحة.", description: "لأعمال المواقع والفرص المهنية والتعاون أو أسئلة البرامج، استخدم وسيلة التواصل المناسبة أدناه." } : language === "ha" ? { eyebrow: "Tuntuɓa", title: "Fara tattaunawa mai ma'ana.", description: "Don aikin yanar gizo, damar sana'a, haɗin gwiwa ko tambayar shiri, yi amfani da hanyar da ta dace a nan." } : { eyebrow: "Contact", title: "Start a clear conversation.", description: "For website work, professional opportunities, collaborations or program questions, use the appropriate contact option." };
  return (
    <main>
      <SectionShell eyebrow={copy.eyebrow} title={copy.title} description={copy.description}><ContactActions /></SectionShell>
      <ContactSection />
    </main>
  );
}
