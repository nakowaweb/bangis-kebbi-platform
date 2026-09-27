import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Car, Download, Linkedin, Mail, MapPin, MessageCircle, Printer } from "lucide-react";

import portrait from "@/assets/bangis-official-hero.webp";
import { useContactLinks } from "@/components/contact-actions";
import { SafeImage } from "@/components/safe-image";
import { Button } from "@/components/ui/button";
import { getPublicEntry } from "@/lib/content.functions";
import { useLanguage } from "@/lib/language";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/cv")({
  head: ({ match }) => pageHead({ search: match.search, title: "Professional CV — Abubakar Alhaji Abubakar, AI Web Designer & Web Developer", description: "CV of Abubakar Alhaji Abubakar: AI web design, web development, UI/UX, WordPress, CMS and database-driven applications. Based in Kebbi State, Nigeria; available remotely.", path: "/cv" }),
  component: CvPage,
});

type Copy = { title: string; profileLabel: string; profile: string; skillsLabel: string; skills: string[]; experienceLabel: string; role: string; roleMeta: string; experience: string[]; availableForLabel: string; availableFor: string[]; projectsLabel: string; projects: string[]; strengthsLabel: string; strengths: string[]; drivingLabel: string; driving: string; locationLabel: string; location: string; availabilityLabel: string; availability: string; download: string; print: string; contactMe: string; email: string };

const copy: Record<"en" | "ar" | "ha", Copy> = {
  en: {
    title: "AI Web Designer & Web Developer", profileLabel: "Professional profile",
    profile: "AI-assisted web designer and web developer focused on modern responsive websites, business websites, UI/UX design, WordPress, database-driven web applications, CMS platforms and practical digital solutions.",
    skillsLabel: "Core skills",
    skills: ["AI Web Design", "Web Development", "UI/UX Design", "WordPress Development", "Responsive Web Design", "Database-Driven Applications", "CMS Development", "Authentication Systems", "Member Platforms", "Admin Dashboards", "Website Maintenance", "SEO Foundations", "Multilingual Websites", "AI-Assisted Digital Workflows"],
    experienceLabel: "Experience", role: "AI Web Designer & Web Developer", roleMeta: "Remote / Digital Work · Since 2024",
    experience: ["Design and development of business and personal websites", "Responsive interfaces planned mobile-first", "CMS platforms with multilingual content and administrator control", "Database-connected applications with authentication and member dashboards", "AI-assisted research, content and production workflows", "Practical digital solutions and ongoing website maintenance"],
    availableForLabel: "Available for", availableFor: ["Web design", "Web development", "UI/UX work", "WordPress projects", "Digital business websites", "Web applications", "Website maintenance", "Remote client work", "International opportunities"],
    projectsLabel: "Projects", projects: ["BangisKebbi.com — personal brand platform", "Hospitality Resort Concept (Concept / Demo)", "Business Website Concept (Concept / Demo)", "Other portfolio concepts: e-commerce, hotel, corporate, personal brand and service company (Concept / Demo)"],
    strengthsLabel: "Professional strengths", strengths: ["Problem solving", "Research", "Digital product thinking", "Continuous learning", "Professional communication", "Independent project execution"],
    drivingLabel: "Driving", driving: "Valid Nigerian Driving Licence", locationLabel: "Location", location: "Kebbi State, Nigeria",
    availabilityLabel: "Availability", availability: "Available for suitable client work, professional opportunities and collaborations in Nigeria and internationally/remotely.",
    download: "Download CV", print: "Print CV", contactMe: "Contact Me", email: "Email",
  },
  ar: {
    title: "مصمم مواقع بالذكاء الاصطناعي ومطور ويب", profileLabel: "الملف المهني",
    profile: "مصمم ومطور مواقع يستعين بالذكاء الاصطناعي، يركز على المواقع الحديثة المتجاوبة ومواقع الأعمال وتصميم UI/UX وووردبريس وتطبيقات الويب المعتمدة على قواعد البيانات وأنظمة إدارة المحتوى والحلول الرقمية العملية.",
    skillsLabel: "المهارات الأساسية",
    skills: ["تصميم المواقع بالذكاء الاصطناعي", "تطوير الويب", "تصميم UI/UX", "تطوير ووردبريس", "التصميم المتجاوب", "تطبيقات قواعد البيانات", "تطوير أنظمة المحتوى", "أنظمة تسجيل الدخول", "منصات الأعضاء", "لوحات الإدارة", "صيانة المواقع", "أساسيات SEO", "المواقع متعددة اللغات", "مسارات عمل رقمية بالذكاء الاصطناعي"],
    experienceLabel: "الخبرة", role: "مصمم مواقع بالذكاء الاصطناعي ومطور ويب", roleMeta: "عمل رقمي / عن بُعد · منذ 2024",
    experience: ["تصميم وتطوير مواقع الأعمال والمواقع الشخصية", "واجهات متجاوبة تبدأ من الجوال", "أنظمة محتوى متعددة اللغات مع تحكم إداري", "تطبيقات مرتبطة بقواعد البيانات مع تسجيل دخول ولوحات أعضاء", "بحث ومحتوى وتنفيذ بمساعدة الذكاء الاصطناعي", "حلول رقمية عملية وصيانة مستمرة للمواقع"],
    availableForLabel: "متاح لـ", availableFor: ["تصميم المواقع", "تطوير الويب", "أعمال UI/UX", "مشاريع ووردبريس", "مواقع الأعمال الرقمية", "تطبيقات الويب", "صيانة المواقع", "العمل عن بُعد مع العملاء", "الفرص الدولية"],
    projectsLabel: "المشاريع", projects: ["BangisKebbi.com — منصة علامة شخصية", "تصور منتجع ضيافة (تصور / عرض)", "تصور موقع أعمال (تصور / عرض)", "تصورات أخرى: متجر، فندق، شركة، علامة شخصية، شركة خدمات (تصور / عرض)"],
    strengthsLabel: "نقاط القوة المهنية", strengths: ["حل المشكلات", "البحث", "التفكير في المنتج الرقمي", "التعلم المستمر", "التواصل المهني", "تنفيذ المشاريع باستقلالية"],
    drivingLabel: "القيادة", driving: "رخصة قيادة نيجيرية سارية", locationLabel: "الموقع", location: "ولاية كيبي، نيجيريا",
    availabilityLabel: "التوفر", availability: "متاح لأعمال العملاء المناسبة والفرص المهنية والتعاون داخل نيجيريا ودولياً وعن بُعد.",
    download: "تنزيل السيرة الذاتية", print: "طباعة السيرة الذاتية", contactMe: "تواصل معي", email: "البريد الإلكتروني",
  },
  ha: {
    title: "Mai Ƙirar Yanar Gizo da AI & Mai Haɓaka Yanar Gizo", profileLabel: "Bayanin sana'a",
    profile: "Mai ƙira da haɓaka yanar gizo tare da taimakon AI, wanda ya mai da hankali kan gidajen yanar gizo na zamani masu daidaituwa, na kasuwanci, ƙirar UI/UX, WordPress, manhajojin yanar gizo masu amfani da bayanai, tsarin CMS da hanyoyin dijital masu amfani.",
    skillsLabel: "Babban ƙwarewa",
    skills: ["Ƙirar Yanar Gizo da AI", "Haɓaka Yanar Gizo", "Ƙirar UI/UX", "Haɓaka WordPress", "Ƙira mai Daidaituwa", "Manhajoji masu Bayanai", "Haɓaka CMS", "Tsarin Shiga", "Dandalin Mambobi", "Dashboard na Gudanarwa", "Kula da Yanar Gizo", "Tushen SEO", "Yanar Gizo masu Harsuna", "Ayyukan Dijital da AI"],
    experienceLabel: "Kwarewa", role: "Mai Ƙirar Yanar Gizo da AI & Mai Haɓaka Yanar Gizo", roleMeta: "Aiki daga nesa / na dijital · Tun 2024",
    experience: ["Ƙira da haɓaka gidajen yanar gizo na kasuwanci da na kai", "Fuskoki masu daidaituwa daga wayar hannu", "Tsarin CMS masu harsuna tare da ikon gudanarwa", "Manhajoji masu bayanai tare da shiga da dashboard na mamba", "Bincike, abun ciki da ginawa tare da AI", "Hanyoyin dijital masu amfani da kulawa ta dindindin"],
    availableForLabel: "Ina samuwa don", availableFor: ["Ƙirar yanar gizo", "Haɓaka yanar gizo", "Aikin UI/UX", "Ayyukan WordPress", "Yanar gizon kasuwanci", "Manhajojin yanar gizo", "Kula da yanar gizo", "Aiki daga nesa", "Damar ƙasashen waje"],
    projectsLabel: "Ayyuka", projects: ["BangisKebbi.com — dandalin brand na kai", "Tsarin Wurin Hutu (Samfuri / Demo)", "Tsarin Yanar Gizon Kasuwanci (Samfuri / Demo)", "Sauran samfura: shago, otal, kamfani, brand na kai, kamfanin sabis (Samfuri / Demo)"],
    strengthsLabel: "Ƙarfin sana'a", strengths: ["Warware matsala", "Bincike", "Tunanin samfurin dijital", "Ci gaba da koyo", "Sadarwa ta ƙwararru", "Aiwatar da aiki da kai"],
    drivingLabel: "Tuƙi", driving: "Ingantaccen Lasin Tuƙi na Najeriya", locationLabel: "Wuri", location: "Jihar Kebbi, Najeriya",
    availabilityLabel: "Samuwa", availability: "Ina samuwa don aikin kwastomomi, damar sana'a da haɗin gwiwa a Najeriya da ƙasashen waje/daga nesa.",
    download: "Sauke CV", print: "Buga CV", contactMe: "Tuntuɓe Ni", email: "Imel",
  },
};

function CvPage() {
  const { language } = useLanguage();
  const c = copy[language === "ar" || language === "ha" ? language : "en"];
  const load = useServerFn(getPublicEntry);
  const managed = useQuery({ queryKey: ["professional-cv", language], queryFn: () => load({ data: { contentType: "about", slug: "professional-cv", language } }), staleTime: 1_800_000 }).data;
  const links = useContactLinks();
  return (
    <main className="cv-page bg-background py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <header className="grid gap-6 rounded-lg border border-border bg-card p-6 shadow-platform sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
          <SafeImage src={portrait} alt="Abubakar Alhaji Abubakar" className="aspect-square w-32 rounded-lg object-cover" />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-primary">Curriculum Vitae</p>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Abubakar Alhaji Abubakar</h1>
            <p className="mt-2 text-lg font-semibold text-foreground">{managed?.title ?? c.title}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {c.location}</span>
              <span className="flex items-center gap-2"><Car className="h-4 w-4" /> {c.driving}</span>
            </div>
          </div>
        </header>
        <div className="mt-5 flex flex-wrap gap-3 print:hidden">
          <Button onClick={() => window.print()}><Download /> {c.download}</Button>
          <Button variant="outline" onClick={() => window.print()}><Printer /> {c.print}</Button>
          <Button variant="outline" asChild><Link to="/contact">{c.contactMe}</Link></Button>
          {links.linkedin ? <Button variant="outline" asChild><a href={links.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin /> LinkedIn</a></Button> : null}
          {links.whatsapp ? <Button variant="outline" asChild><a href={links.whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle /> WhatsApp</a></Button> : null}
          {links.email ? <Button variant="outline" asChild><a href={links.email}><Mail /> {c.email}</a></Button> : null}
        </div>
        <section className="mt-10"><h2 className="font-display text-xl font-bold">{c.profileLabel}</h2><p className="mt-3 max-w-4xl whitespace-pre-line text-base leading-8 text-muted-foreground">{managed?.body ?? managed?.summary ?? c.profile}</p></section>
        <section className="mt-10"><h2 className="font-display text-xl font-bold">{c.skillsLabel}</h2><ul className="mt-4 flex flex-wrap gap-2">{c.skills.map((s) => <li key={s} className="rounded-md border border-border bg-secondary/50 px-3 py-1.5 text-sm font-medium">{s}</li>)}</ul></section>
        <section className="mt-10 rounded-lg border border-border p-6"><h2 className="font-display text-xl font-bold">{c.experienceLabel}</h2><p className="mt-3 font-semibold">{c.role}</p><p className="text-sm text-muted-foreground">{c.roleMeta}</p><CvItems items={c.experience} /></section>
        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <section><h2 className="font-display text-xl font-bold">{c.availableForLabel}</h2><CvItems items={c.availableFor} /></section>
          <section><h2 className="font-display text-xl font-bold">{c.projectsLabel}</h2><CvItems items={c.projects} /></section>
          <section><h2 className="font-display text-xl font-bold">{c.strengthsLabel}</h2><CvItems items={c.strengths} /></section>
          <section><h2 className="font-display text-xl font-bold">{c.drivingLabel} · {c.locationLabel}</h2><CvItems items={[c.driving, c.location]} /><h2 className="mt-8 font-display text-xl font-bold">{c.availabilityLabel}</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{c.availability}</p></section>
        </div>
      </div>
    </main>
  );
}

function CvItems({ items }: { items: string[] }) {
  return <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground">{items.map((item) => <li key={item} className="flex gap-2"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{item}</li>)}</ul>;
}
