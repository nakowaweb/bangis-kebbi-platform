import { Link } from "@tanstack/react-router";
import { ArrowRight, ExternalLink, LayoutGrid } from "lucide-react";

import { SafeImage } from "@/components/safe-image";
import { useLanguage } from "@/lib/language";
import digitalServices from "@/assets/business-digital-services.webp";
import networking from "@/assets/business-networking.webp";
import technology from "@/assets/business-technology.webp";
import community from "@/assets/business-community.webp";
import global from "@/assets/business-global-opportunities.webp";

type L = { en: string; ar: string; ha: string };
export const opportunityCategories: Array<{ slug: string; label: L; icon: string }> = [
  { slug: "digital-services", label: { en: "Digital Services", ar: "الخدمات الرقمية", ha: "Ayyukan Dijital" }, icon: digitalServices },
  { slug: "business-networking", label: { en: "Business Networking", ar: "شبكات الأعمال", ha: "Hanyar Sadarwar Kasuwanci" }, icon: networking },
  { slug: "technology", label: { en: "Technology", ar: "التكنولوجيا", ha: "Fasaha" }, icon: technology },
  { slug: "community", label: { en: "Community", ar: "المجتمع", ha: "Al'umma" }, icon: community },
  { slug: "global-opportunities", label: { en: "Global Opportunities", ar: "فرص عالمية", ha: "Damarmaki na Duniya" }, icon: global },
];
export const opportunityCategorySlugs = opportunityCategories.map((c) => c.slug);

export const opportunityCopy = {
  title: { en: "Business Opportunities", ar: "فرص الأعمال", ha: "Damarmakin Kasuwanci" },
  description: {
    en: "Explore business opportunities researched by Bangis Kebbi. Read our findings, review the company details and use the links below to learn more or register.",
    ar: "استكشف فرص الأعمال التي بحثها بانغيس كيبي. اقرأ نتائجنا، وراجع تفاصيل الشركة، واستخدم الروابط أدناه لمعرفة المزيد أو التسجيل.",
    ha: "Bincika damarmakin kasuwanci da Bangis Kebbi ya yi bincike a kansu. Karanta sakamakon bincikenmu, duba bayanan kamfanin kuma yi amfani da hanyoyin da ke ƙasa don ƙarin bayani ko yin rajista.",
  },
  all: { en: "All", ar: "الكل", ha: "Duka" },
  viewDetails: { en: "View details", ar: "عرض التفاصيل", ha: "Duba cikakkun bayanai" },
  empty: { en: "No opportunities have been published yet.", ar: "لم تُنشر أي فرص بعد.", ha: "Ba a wallafa wata dama ba tukuna." },
  register: { en: "Register", ar: "التسجيل", ha: "Yi rajista" },
  external: {
    en: "This button opens the company's own website. Bangis Kebbi's review is for information only — please do your own research before joining.",
    ar: "يفتح هذا الزر موقع الشركة نفسها. مراجعة بانغيس كيبي للمعلومات فقط — يُرجى إجراء بحثك الخاص قبل الانضمام.",
    ha: "Wannan maɓallin yana buɗe shafin kamfanin kansa. Bitar Bangis Kebbi don bayani ne kawai — da fatan ka yi naka binciken kafin ka shiga.",
  },
  back: { en: "All opportunities", ar: "كل الفرص", ha: "Duk damarmaki" },
  review: { en: "Our research & review", ar: "بحثنا ومراجعتنا", ha: "Bincikenmu da bita" },
};

export const pick = (value: L, language: string) => (language === "ar" ? value.ar : language === "ha" ? value.ha : value.en);

export type OpportunityItem = { id: string; slug: string; title: string; summary: string | null; category: string | null; imageUrl?: string | null; image_alt?: string | null };

export function BusinessOpportunities({ items }: { items: OpportunityItem[] }) {
  const { language } = useLanguage();
  const visible = items;
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">{pick(opportunityCopy.title, language)}</h1>
      <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{pick(opportunityCopy.description, language)}</p>

      {/* Only "All" is public; category metadata stays on each entry for admin use. */}
      <div className="mt-8"><span aria-current="true" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary bg-primary/10 px-4 text-sm font-bold"><LayoutGrid className="size-4 text-primary" aria-hidden="true" />{pick(opportunityCopy.all, language)}</span></div>

      {visible.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{pick(opportunityCopy.empty, language)}</p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => {
            const cat = opportunityCategories.find((c) => c.slug === item.category);
            return (
              <li key={item.id} className="motion-card flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-platform">
                <Link to="/business/$slug" params={{ slug: item.slug }} tabIndex={-1} aria-hidden="true" className="block aspect-[16/9] overflow-hidden bg-secondary">
                  <SafeImage src={item.imageUrl ?? cat?.icon} alt="" loading="lazy" width={640} height={360} className="size-full object-cover" />
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="mt-1 font-display text-lg font-bold leading-6"><Link to="/business/$slug" params={{ slug: item.slug }} className="hover:underline">{item.title}</Link></h2>
                  {item.summary ? <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{item.summary}</p> : <span className="flex-1" />}
                  <Link to="/business/$slug" params={{ slug: item.slug }} className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary">{pick(opportunityCopy.viewDetails, language)} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" /></Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function ExternalCta({ url, label }: { url: string; label: string }) {
  const { language } = useLanguage();
  return (
    <div className="grid gap-2">
      <a href={url} target="_blank" rel="noopener noreferrer nofollow sponsored" className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5">
        {label} <ExternalLink className="size-4" aria-hidden="true" />
      </a>
      <p className="text-xs text-muted-foreground">{pick(opportunityCopy.external, language)}</p>
    </div>
  );
}
