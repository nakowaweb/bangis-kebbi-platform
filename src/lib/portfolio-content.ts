import type { LanguageCode } from "@/lib/i18n/dictionary";

import bangisImage from "@/assets/global-city-hero.webp";
import resortImage from "@/assets/resort-concept.webp";
import businessImage from "@/assets/business-website.webp";
import ecommerceImage from "@/assets/ecommerce-concept.webp";
import hotelImage from "@/assets/hotel-concept.webp";
import corporateImage from "@/assets/corporate-concept.webp";
import personalBrandImage from "@/assets/personal-brand-concept.webp";
import serviceCompanyImage from "@/assets/service-company-concept.webp";

type LocalizedText = Record<LanguageCode, string>;
export const text = (value: LocalizedText, language: LanguageCode) => value[language] || value.en;

export type ServiceDefinition = {
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  image: string;
  imageAlt: LocalizedText;
  canDo: Record<LanguageCode, string[]>;
  audience: Record<LanguageCode, string[]>;
  process: Record<LanguageCode, string[]>;
};

const serviceVisuals = [ecommerceImage, corporateImage, personalBrandImage, businessImage, serviceCompanyImage, hotelImage];
const serviceBase = [
  ["ai-web-design", "AI Web Design", "تصميم المواقع بمساعدة الذكاء الاصطناعي", "Ƙirar Yanar Gizo da AI"],
  ["web-development", "Web Development", "تطوير المواقع", "Haɓaka Yanar Gizo"],
  ["ui-ux-design", "UI/UX Design", "تصميم واجهة وتجربة المستخدم", "Ƙirar UI/UX"],
  ["wordpress-development", "WordPress Development", "تطوير ووردبريس", "Haɓaka WordPress"],
  ["digital-business-solutions", "Digital Business Solutions", "حلول الأعمال الرقمية", "Hanyoyin Kasuwanci na Dijital"],
  ["website-maintenance", "Website Maintenance", "صيانة المواقع", "Kula da Gidan Yanar Gizo"],
] as const;

const summaries: Record<string, LocalizedText> = {
  "ai-web-design": { en: "Modern, responsive websites shaped with AI-assisted research, design and production workflows.", ar: "مواقع حديثة ومتجاوبة تُبنى ببحث وتصميم وتنفيذ مدعوم بالذكاء الاصطناعي.", ha: "Gidajen yanar gizo na zamani masu daidaituwa, tare da bincike da ƙira da AI ke taimakawa." },
  "web-development": { en: "Custom websites and database-connected applications built for real operational needs.", ar: "مواقع مخصصة وتطبيقات مرتبطة بقواعد البيانات لتلبية احتياجات تشغيلية حقيقية.", ha: "Gidajen yanar gizo na musamman da manhajoji masu haɗin bayanai don bukatun aiki na gaske." },
  "ui-ux-design": { en: "Clear, accessible digital experiences that help people complete important tasks confidently.", ar: "تجارب رقمية واضحة وسهلة تساعد المستخدمين على إنجاز مهامهم بثقة.", ha: "Kwarewar dijital mai sauƙi da fahimta wadda ke taimaka wa mutane su kammala ayyuka cikin kwarin gwiwa." },
  "wordpress-development": { en: "Professional WordPress websites that are easy to manage, extend and maintain.", ar: "مواقع ووردبريس احترافية يسهل إدارتها وتطويرها وصيانتها.", ha: "Gidajen WordPress na ƙwararru masu sauƙin sarrafawa, faɗaɗawa da kulawa." },
  "digital-business-solutions": { en: "Practical systems for content, customer journeys, member access and digital operations.", ar: "أنظمة عملية للمحتوى ورحلات العملاء ووصول الأعضاء والعمليات الرقمية.", ha: "Tsare-tsare masu amfani don abun ciki, tafiyar abokin ciniki, shiga ta mamba da ayyukan dijital." },
  "website-maintenance": { en: "Reliable updates, monitoring and improvements that keep websites useful and current.", ar: "تحديثات ومتابعة وتحسينات موثوقة تحافظ على فاعلية الموقع وحداثته.", ha: "Sabuntawa, sa ido da ingantawa masu aminci don gidan yanar gizo ya kasance mai amfani kuma na zamani." },
};

export const services: ServiceDefinition[] = serviceBase.map(([slug, en, ar, ha], index) => ({
  slug,
  title: { en, ar, ha },
  summary: summaries[slug],
  image: serviceVisuals[index] ?? businessImage,
  imageAlt: { en: `${en} service concept`, ar: `تصور لخدمة ${ar}`, ha: `Hoton tsarin sabis na ${ha}` },
  canDo: {
    en: slug === "ui-ux-design" ? ["User journeys and interface planning", "Wireframes and polished screen design", "Responsive and accessible interaction patterns"] : slug === "website-maintenance" ? ["Content and software updates", "Performance and usability checks", "Issue resolution and continuous improvement"] : ["Discovery and practical scope definition", "Responsive website or application delivery", "Content, CMS and launch preparation"],
    ar: slug === "ui-ux-design" ? ["تخطيط رحلة المستخدم والواجهات", "مخططات أولية وتصميم شاشات متقن", "أنماط تفاعل متجاوبة وسهلة الوصول"] : slug === "website-maintenance" ? ["تحديث المحتوى والبرمجيات", "فحوص الأداء وسهولة الاستخدام", "حل المشكلات والتحسين المستمر"] : ["اكتشاف الاحتياج وتحديد نطاق عملي", "تنفيذ موقع أو تطبيق متجاوب", "إعداد المحتوى ونظام الإدارة والإطلاق"],
    ha: slug === "ui-ux-design" ? ["Tsarin tafiyar mai amfani da fuskar manhaja", "Wireframe da ƙirar allo mai kyau", "Hanyoyin mu'amala masu daidaituwa da sauƙin amfani"] : slug === "website-maintenance" ? ["Sabunta abun ciki da software", "Duba sauri da sauƙin amfani", "Gyara matsaloli da ci gaba da ingantawa"] : ["Fahimtar buƙata da tsara aikin", "Gina gidan yanar gizo ko manhaja mai daidaituwa", "Shirya abun ciki, CMS da ƙaddamarwa"],
  },
  audience: {
    en: ["Businesses building a credible online presence", "Professionals and organizations with a clear service", "Teams replacing an outdated or difficult website"],
    ar: ["الشركات التي تبني حضوراً رقمياً موثوقاً", "المهنيون والمؤسسات ذات الخدمة الواضحة", "الفرق التي تستبدل موقعاً قديماً أو صعب الاستخدام"],
    ha: ["Kasuwancin da ke gina kasancewa mai kyau a intanet", "Ƙwararru da ƙungiyoyi masu sabis a bayyane", "Ƙungiyoyin da ke maye gurbin tsohon gidan yanar gizo"],
  },
  process: {
    en: ["Understand the goal and audience", "Plan the content and experience", "Design, build and review", "Launch carefully and support improvement"],
    ar: ["فهم الهدف والجمهور", "تخطيط المحتوى والتجربة", "التصميم والتنفيذ والمراجعة", "إطلاق مدروس ودعم التحسين"],
    ha: ["Fahimtar buri da masu amfani", "Tsara abun ciki da kwarewa", "Ƙira, ginawa da dubawa", "Ƙaddamarwa cikin kulawa da tallafin ingantawa"],
  },
}));

export type ProjectDefinition = {
  slug: string;
  title: LocalizedText;
  category: LocalizedText;
  summary: LocalizedText;
  image: string;
  imageAlt: LocalizedText;
  concept: boolean;
  sections: Record<LanguageCode, Array<{ title: string; body: string }>>;
};

const projectRows = [
  { slug: "bangiskebbi-com", title: ["BangisKebbi.com", "BangisKebbi.com", "BangisKebbi.com"], category: ["Personal Brand Platform", "منصة علامة شخصية", "Dandalin Brand na Kai"], image: bangisImage, concept: false },
  { slug: "hospitality-resort-concept", title: ["Hospitality Resort Concept", "تصور موقع منتجع ضيافة", "Tsarin Gidan Yanar Gizon Wurin Hutu"], category: ["UI/UX Design", "تصميم UI/UX", "Ƙirar UI/UX"], image: resortImage, concept: true },
  { slug: "business-website-concept", title: ["Business Website Concept", "تصور موقع أعمال", "Tsarin Gidan Yanar Gizon Kasuwanci"], category: ["Web Development", "تطوير المواقع", "Haɓaka Yanar Gizo"], image: businessImage, concept: true },
  { slug: "ecommerce-website-concept", title: ["E-commerce Website Concept", "تصور متجر إلكتروني", "Tsarin Shagon Intanet"], category: ["Commerce Experience", "تجربة تجارة إلكترونية", "Kwarewar Ciniki ta Intanet"], image: ecommerceImage, concept: true },
  { slug: "hotel-website-concept", title: ["Hotel Website Concept", "تصور موقع فندق", "Tsarin Gidan Yanar Gizon Otal"], category: ["Hospitality Web Design", "تصميم مواقع الضيافة", "Ƙirar Yanar Gizon Baƙi"], image: hotelImage, concept: true },
  { slug: "corporate-business-website-concept", title: ["Corporate Business Website Concept", "تصور موقع شركة", "Tsarin Gidan Yanar Gizon Kamfani"], category: ["Corporate Web Design", "تصميم مواقع الشركات", "Ƙirar Yanar Gizon Kamfani"], image: corporateImage, concept: true },
  { slug: "personal-brand-website-concept", title: ["Personal Brand Website Concept", "تصور موقع علامة شخصية", "Tsarin Gidan Yanar Gizon Brand na Kai"], category: ["Personal Brand", "علامة شخصية", "Brand na Kai"], image: personalBrandImage, concept: true },
  { slug: "service-company-website-concept", title: ["Service Company Website Concept", "تصور موقع شركة خدمات", "Tsarin Gidan Yanar Gizon Kamfanin Sabis"], category: ["Service Business", "أعمال خدمية", "Kasuwancin Sabis"], image: serviceCompanyImage, concept: true },
] as const;

export const projects: ProjectDefinition[] = projectRows.map((row) => ({
  slug: row.slug,
  title: { en: row.title[0], ar: row.title[1], ha: row.title[2] },
  category: { en: row.category[0], ar: row.category[1], ha: row.category[2] },
  summary: row.concept
    ? { en: "A premium demonstration exploring clear content, responsive structure and a focused customer journey.", ar: "نموذج احترافي يستكشف وضوح المحتوى والبنية المتجاوبة ورحلة عميل مركزة.", ha: "Samfurin ƙwararru da ke nuna ingantaccen abun ciki, tsari mai daidaituwa da tafiyar abokin ciniki." }
    : { en: "A multilingual personal-brand platform combining professional services, portfolio content, community information and secure member experiences.", ar: "منصة علامة شخصية متعددة اللغات تجمع الخدمات المهنية والأعمال والمجتمع وتجربة أعضاء آمنة.", ha: "Dandalin brand na kai mai harsuna da ke haɗa ayyukan ƙwararru, kundin aiki, al’umma da wurin mamba mai tsaro." },
  image: row.image,
  imageAlt: { en: `${row.title[0]} visual`, ar: `صورة ${row.title[1]}`, ha: `Hoton ${row.title[2]}` },
  concept: row.concept,
  sections: {
    en: row.concept ? [
      { title: "Concept direction", body: "A clear visual system presents the offer quickly while keeping the path to enquiry or booking easy to follow." },
      { title: "Experience structure", body: "The concept covers a focused homepage, services or offers, trust-building information, responsive navigation and professional calls to action." },
      { title: "Design reasoning", body: "Strong hierarchy, useful spacing and mobile-first decisions keep important actions visible without overwhelming the visitor." },
    ] : [
      { title: "Purpose and direction", body: "BangisKebbi.com presents Abubakar Alhaji Abubakar’s professional work, ideas and community initiatives through one coherent global platform." },
      { title: "Platform capabilities", body: "The platform includes responsive public pages, a CMS, multilingual content, search foundations, secure authentication, a member dashboard, Umrah information and humanitarian updates." },
      { title: "Technology and workflow", body: "The project uses a modern full-stack web architecture, database-backed publishing, private media access and role-based administration." },
    ],
    ar: row.concept ? [
      { title: "اتجاه التصور", body: "نظام بصري واضح يعرض الخدمة بسرعة ويجعل الوصول إلى الاستفسار أو الحجز سهلاً." },
      { title: "بنية التجربة", body: "يشمل التصور صفحة رئيسية مركزة وخدمات ومعلومات تعزز الثقة وتنقلاً متجاوباً ودعوات واضحة لاتخاذ إجراء." },
      { title: "منطق التصميم", body: "تسلسل بصري قوي ومساحات مدروسة وقرارات تبدأ من الجوال تحافظ على وضوح أهم الإجراءات." },
    ] : [
      { title: "الهدف والاتجاه", body: "يعرض BangisKebbi.com أعمال أبوبكر الحاج أبوبكر المهنية وأفكاره ومبادراته المجتمعية في منصة عالمية متكاملة." },
      { title: "قدرات المنصة", body: "تضم المنصة صفحات متجاوبة ونظام إدارة محتوى وتعدد اللغات وأساسيات البحث وتسجيل دخول آمناً ولوحة أعضاء ومعلومات العمرة وتحديثات إنسانية." },
      { title: "التقنية وسير العمل", body: "يستخدم المشروع بنية ويب حديثة متكاملة ونشراً مرتبطاً بقاعدة بيانات ووصولاً خاصاً للوسائط وإدارة حسب الأدوار." },
    ],
    ha: row.concept ? [
      { title: "Hanyar samfurin", body: "Tsarin gani mai sauƙi yana bayyana tayin da wuri kuma yana sauƙaƙa hanyar tambaya ko yin booking." },
      { title: "Tsarin kwarewa", body: "Samfurin ya ƙunshi shafin farko, ayyuka, bayanan amincewa, kewayawa mai daidaituwa da kira zuwa aiki." },
      { title: "Dalilin ƙira", body: "Matsayin rubutu mai kyau, sarari mai amfani da tsarin wayar hannu suna sa muhimman ayyuka su kasance a bayyane." },
    ] : [
      { title: "Manufa da alkibla", body: "BangisKebbi.com yana gabatar da aikin ƙwararru, ra’ayoyi da shirye-shiryen al’umma na Abubakar Alhaji Abubakar a dandali guda na duniya." },
      { title: "Abubuwan dandalin", body: "Dandalin yana da shafuka masu daidaituwa, CMS, harsuna da dama, tsarin bincike, shiga mai tsaro, dashboard na mamba, bayanin Umrah da sabbin bayanan jin kai." },
      { title: "Fasaha da tsarin aiki", body: "Aikin yana amfani da tsarin yanar gizo na zamani, wallafa mai haɗin bayanai, kafofin sirri da gudanarwa bisa matsayi." },
    ],
  },
}));

export function serviceBySlug(slug: string) { return services.find((item) => item.slug === slug); }
export function projectBySlug(slug: string) { return projects.find((item) => item.slug === slug); }
