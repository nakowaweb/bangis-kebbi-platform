import type { LanguageCode } from "@/lib/i18n/dictionary";

import bangisProjectAsset from "@/assets/projects/project-bangiskebbi.webp.asset.json";
import resortProjectAsset from "@/assets/projects/project-resort.webp.asset.json";
import businessProjectAsset from "@/assets/projects/project-business.webp.asset.json";
import ecommerceProjectAsset from "@/assets/projects/project-ecommerce.webp.asset.json";
import hotelProjectAsset from "@/assets/projects/project-hotel.webp.asset.json";
import personalBrandProjectAsset from "@/assets/projects/project-personal-brand.webp.asset.json";
import corporateImage from "@/assets/corporate-concept-final.webp";
import serviceCompanyImage from "@/assets/service-company-concept-final.webp";
import aiWebDesignImage from "@/assets/service-ai-web-design.jpg";
import webDevelopmentImage from "@/assets/service-web-development.jpg";
import uiUxDesignImage from "@/assets/service-ui-ux-design.jpg";
import wordpressDevelopmentImage from "@/assets/service-wordpress-development.jpg";
import digitalBusinessSolutionsImage from "@/assets/service-digital-business-solutions.jpg";
import websiteMaintenanceImage from "@/assets/service-website-maintenance.jpg";
import blogDigitalOpportunitiesAsset from "@/assets/blog-digital-opportunities.png.asset.json";
import blogAiDesignAsset from "@/assets/blog-ai-design.png.asset.json";
import blogBusinessAsset from "@/assets/blog-business.png.asset.json";

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

const serviceVisuals = [aiWebDesignImage, webDevelopmentImage, uiUxDesignImage, wordpressDevelopmentImage, digitalBusinessSolutionsImage, websiteMaintenanceImage];
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
  summary: summaries[slug] ?? summaries["web-development"] ?? { en: "Professional digital service.", ar: "خدمة رقمية احترافية.", ha: "Sabis na dijital na ƙwararru." },
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
  { slug: "bangiskebbi-com", title: ["BangisKebbi.com", "BangisKebbi.com", "BangisKebbi.com"], category: ["Digital Project", "مشروع رقمي", "Aikin Dijital"], image: bangisProjectAsset.url, concept: false },
  { slug: "hospitality-resort-concept", title: ["Hospitality Resort Concept", "تصور موقع منتجع ضيافة", "Tsarin Gidan Yanar Gizon Wurin Hutu"], category: ["Digital Project", "مشروع رقمي", "Aikin Dijital"], image: resortProjectAsset.url, concept: true },
  { slug: "business-website-concept", title: ["Business Website Concept", "تصور موقع أعمال", "Tsarin Gidan Yanar Gizon Kasuwanci"], category: ["Digital Project", "مشروع رقمي", "Aikin Dijital"], image: businessProjectAsset.url, concept: true },
  { slug: "ecommerce-website-concept", title: ["E-commerce Website Concept", "تصور متجر إلكتروني", "Tsarin Shagon Intanet"], category: ["Digital Project", "مشروع رقمي", "Aikin Dijital"], image: ecommerceProjectAsset.url, concept: true },
  { slug: "hotel-website-concept", title: ["Hotel Website Concept", "تصور موقع فندق", "Tsarin Gidan Yanar Gizon Otal"], category: ["Digital Project", "مشروع رقمي", "Aikin Dijital"], image: hotelProjectAsset.url, concept: true },
  { slug: "personal-brand-website-concept", title: ["Personal Brand Website Concept", "تصور موقع علامة شخصية", "Tsarin Gidan Yanar Gizon Brand na Kai"], category: ["Digital Project", "مشروع رقمي", "Aikin Dijital"], image: personalBrandProjectAsset.url, concept: true },
  { slug: "corporate-business-website-concept", title: ["Corporate Business Website Concept", "تصور موقع شركة", "Tsarin Gidan Yanar Gizon Kamfani"], category: ["Digital Project", "مشروع رقمي", "Aikin Dijital"], image: corporateImage, concept: true },
  { slug: "service-company-website-concept", title: ["Service Company Website Concept", "تصور موقع شركة خدمات", "Tsarin Gidan Yanar Gizon Kamfanin Sabis"], category: ["Digital Project", "مشروع رقمي", "Aikin Dijital"], image: serviceCompanyImage, concept: true },
] as const;

const projectSummaries: Record<string, LocalizedText> = {
  "bangiskebbi-com": { en: "A premium international platform connecting technology, business, ideas and meaningful community opportunities.", ar: "منصة دولية راقية تربط التقنية والأعمال والأفكار والفرص المجتمعية الهادفة.", ha: "Dandali na duniya mai inganci da ke haɗa fasaha, kasuwanci, ra’ayoyi da damar al’umma." },
  "hospitality-resort-concept": { en: "A refined resort experience built around destination discovery, elegant stays and effortless booking journeys.", ar: "تجربة منتجع راقية تتمحور حول اكتشاف الوجهة والإقامة الأنيقة وسهولة الحجز.", ha: "Kwarewar wurin hutu mai kyau don gano wuri, masauki na alfarma da booking mai sauƙi." },
  "business-website-concept": { en: "A confident corporate presence that turns complex services, capabilities and growth opportunities into a clear story.", ar: "حضور مؤسسي واثق يحول الخدمات والقدرات وفرص النمو المعقدة إلى قصة واضحة.", ha: "Kasancewar kamfani mai ƙarfi da ke bayyana ayyuka, ƙwarewa da damar bunƙasa a sarari." },
  "ecommerce-website-concept": { en: "A streamlined online store with clear product discovery, confident purchase decisions and a mobile-first checkout path.", ar: "متجر إلكتروني مبسط يسهّل اكتشاف المنتجات واتخاذ قرار الشراء ومسار الدفع عبر الجوال.", ha: "Shagon intanet mai sauƙi don gano kaya, yanke shawarar saya da biyan kuɗi ta waya." },
  "hotel-website-concept": { en: "An elegant hotel showcase combining rooms, amenities and local character in a focused reservation experience.", ar: "عرض فندقي أنيق يجمع الغرف والمرافق والطابع المحلي ضمن تجربة حجز مركزة.", ha: "Nunin otal mai kyau da ke haɗa ɗakuna, kayan more rayuwa da yanayin wuri cikin booking mai sauƙi." },
  "personal-brand-website-concept": { en: "A credible personal portfolio that presents expertise, selected work and professional opportunities with clarity.", ar: "ملف شخصي موثوق يعرض الخبرات والأعمال المختارة والفرص المهنية بوضوح.", ha: "Kundin aikin mutum mai inganci da ke nuna ƙwarewa, ayyuka da damar sana'a a sarari." },
  "corporate-business-website-concept": { en: "A structured corporate platform for presenting expertise, sector insight and measurable business capabilities.", ar: "منصة مؤسسية منظمة لعرض الخبرات والرؤى القطاعية والقدرات العملية القابلة للقياس.", ha: "Dandalin kamfani mai tsari don nuna ƙwarewa, fahimtar fanni da ƙarfinsa na kasuwanci." },
  "service-company-website-concept": { en: "A practical service-booking experience that helps customers compare options, build trust and request support quickly.", ar: "تجربة عملية لحجز الخدمات تساعد العملاء على المقارنة وبناء الثقة وطلب الدعم بسرعة.", ha: "Tsarin booking na sabis da ke taimaka wa kwastoma kwatantawa, amincewa da neman taimako da sauri." },
};

const projectDetailSections: Record<string, Array<{ title: string; body: string }>> = {
  "bangiskebbi-com": [
    { title: "Concept & purpose", body: "A founder-led global platform that brings professional services, projects, useful ideas and community initiatives into one coherent digital presence." },
    { title: "Key features", body: "Multilingual publishing, secure member access, content and media management, global search, project and service libraries, Umrah support information and community programme pages." },
    { title: "Technologies & skills demonstrated", body: "Full-stack web architecture, responsive UI/UX, database-backed CMS workflows, role-based administration, private media handling, accessibility, multilingual SEO and production content design." },
    { title: "Project status", body: "Active platform in continuous development. Public content is live while selected member and administrative workflows remain protected." },
  ],
  "hospitality-resort-concept": [
    { title: "Concept & purpose", body: "A premium destination website concept designed to make the resort atmosphere tangible before a guest begins planning a stay." },
    { title: "Key features", body: "Immersive property imagery, room and villa discovery, amenity highlights, destination guidance, availability prompts and responsive enquiry journeys." },
    { title: "Technologies & skills demonstrated", body: "Hospitality UX strategy, visual storytelling, responsive interface design, conversion-focused information hierarchy and component-based front-end planning." },
    { title: "Project status", body: "Portfolio concept and interactive design demonstration. It is not represented as a commissioned or operating resort website." },
  ],
  "business-website-concept": [
    { title: "Concept & purpose", body: "A modern business platform concept that communicates a company’s offer, credibility and direction without overwhelming prospective clients." },
    { title: "Key features", body: "Focused service pathways, capability summaries, sector insights, trust indicators, responsive contact actions and space for case studies or reports." },
    { title: "Technologies & skills demonstrated", body: "Corporate content strategy, responsive web development, modular design systems, accessible navigation and lead-generation UX." },
    { title: "Project status", body: "Portfolio concept prepared to demonstrate a professional corporate web direction; no operating company is implied." },
  ],
  "ecommerce-website-concept": [
    { title: "Concept & purpose", body: "A product-led commerce concept focused on helping shoppers discover, compare and understand items before moving toward purchase." },
    { title: "Key features", body: "Category navigation, product cards, search and filtering patterns, product detail layouts, basket states and a clear mobile shopping journey." },
    { title: "Technologies & skills demonstrated", body: "Commerce UX, product information architecture, responsive interface design, reusable catalogue components and conversion-aware interaction planning." },
    { title: "Project status", body: "Front-end portfolio concept only. Payments, inventory and fulfilment integrations are not active." },
  ],
  "hotel-website-concept": [
    { title: "Concept & purpose", body: "An elegant hospitality concept that presents rooms, amenities and the guest experience through a calm, premium visual system." },
    { title: "Key features", body: "Room exploration, amenity and dining highlights, gallery layouts, local information, enquiry prompts and a future-ready reservation pathway." },
    { title: "Technologies & skills demonstrated", body: "Luxury brand presentation, hospitality content design, mobile-first layouts, image-led storytelling and reservation journey planning." },
    { title: "Project status", body: "Portfolio concept and design demonstration; booking and property-management connections are reserved for a future implementation." },
  ],
  "personal-brand-website-concept": [
    { title: "Concept & purpose", body: "A professional personal-brand concept that turns experience, capabilities and selected work into a focused and credible online profile." },
    { title: "Key features", body: "Profile introduction, expertise highlights, portfolio previews, service pathways, professional milestones and direct contact actions." },
    { title: "Technologies & skills demonstrated", body: "Personal brand strategy, editorial hierarchy, portfolio UX, responsive presentation and accessible calls to action." },
    { title: "Project status", body: "Portfolio concept designed as a reusable direction for professionals, consultants and creative founders." },
  ],
  "corporate-business-website-concept": [
    { title: "Concept & purpose", body: "A structured corporate platform for an established organisation that needs to communicate expertise, governance and business value clearly." },
    { title: "Key features", body: "Business-unit navigation, capability pages, performance highlights, thought-leadership areas, governance information and qualified enquiry routes." },
    { title: "Technologies & skills demonstrated", body: "Enterprise information architecture, corporate UI systems, responsive development, data-visualisation planning and accessibility-conscious design." },
    { title: "Project status", body: "Original portfolio concept. Company details, metrics and services are illustrative and are not claims about a real organisation." },
  ],
  "service-company-website-concept": [
    { title: "Concept & purpose", body: "A trustworthy service-company concept that helps people understand available support and request the right service with minimal friction." },
    { title: "Key features", body: "Service comparison, coverage information, team credibility, appointment requests, availability patterns, testimonials and responsive support actions." },
    { title: "Technologies & skills demonstrated", body: "Service UX, appointment-flow design, local business content strategy, responsive interfaces and customer-journey optimisation." },
    { title: "Project status", body: "Original portfolio concept. Scheduling, customer accounts and operational integrations are reserved for future development." },
  ],
};

export const projects: ProjectDefinition[] = projectRows.map((row) => ({
  slug: row.slug,
  title: { en: row.title[0], ar: row.title[1], ha: row.title[2] },
  category: { en: row.category[0], ar: row.category[1], ha: row.category[2] },
  summary: projectSummaries[row.slug] ?? { en: "A focused digital project.", ar: "مشروع رقمي هادف.", ha: "Aikin dijital mai manufa." },
  image: row.image,
  imageAlt: { en: `${row.title[0]} visual`, ar: `صورة ${row.title[1]}`, ha: `Hoton ${row.title[2]}` },
  concept: row.concept,
  sections: {
    en: projectDetailSections[row.slug] ?? [],
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

export type ArticleDefinition = {
  slug: string;
  title: LocalizedText;
  category: LocalizedText;
  summary: LocalizedText;
  body: Record<LanguageCode, string[]>;
  image: string;
  author: string;
  publishedAt: string;
};

export const articles: ArticleDefinition[] = [
  {
    slug: "turning-ideas-into-real-opportunities",
    title: { en: "Turning ideas into real opportunities", ar: "تحويل الأفكار إلى فرص حقيقية", ha: "Mayar da ra’ayoyi zuwa damarmaki na gaske" },
    category: { en: "Digital Opportunities", ar: "الفرص الرقمية", ha: "Damarmakin Dijital" },
    summary: { en: "Discover how digital skills, online platforms and strategic connection can turn simple ideas into real opportunities for individuals, businesses and communities.", ar: "اكتشف كيف يمكن للمهارات الرقمية والمنصات الإلكترونية والتواصل الاستراتيجي تحويل الأفكار البسيطة إلى فرص حقيقية للأفراد والشركات والمجتمعات.", ha: "Gano yadda ƙwarewar dijital, dandalan intanet da haɗin kai mai ma'ana za su iya mayar da ra'ayoyi masu sauƙi zuwa damarmaki na gaske ga mutane, kasuwanci da al'umma." },
    body: {
      en: ["A strong idea becomes useful when it solves a clear problem for real people. The first step is not adding more features; it is understanding the audience, the decision they need to make and the simplest path forward.", "A credible digital presence then gives that idea a clear home. Focused content, responsive design and accessible contact options help potential clients or collaborators understand the offer and take the next step.", "Progress comes through testing, listening and improving. Consistent delivery builds confidence more effectively than exaggerated claims."],
      ar: ["تصبح الفكرة قوية عندما تحل مشكلة واضحة لأشخاص حقيقيين. البداية ليست بإضافة مزيد من الخصائص، بل بفهم الجمهور والقرار الذي يحتاج إلى اتخاذه وأبسط طريق إلى الأمام.", "بعد ذلك يمنح الحضور الرقمي الموثوق الفكرة مكاناً واضحاً. يساعد المحتوى المركز والتصميم المتجاوب ووسائل التواصل السهلة العملاء والمتعاونين على فهم العرض واتخاذ الخطوة التالية.", "يتحقق التقدم بالاختبار والاستماع والتحسين. الاستمرارية في التنفيذ تبني الثقة بصورة أفضل من الادعاءات المبالغ فيها."],
      ha: ["Ra’ayi mai ƙarfi yana zama mai amfani idan ya warware matsala a bayyane ga mutane na gaske. Mataki na farko ba ƙara fasali ba ne; fahimtar masu amfani da shawarar da suke son yanke wa ne.", "Kasancewa mai kyau a intanet yana ba wa ra’ayin gida mai ma’ana. Abun ciki mai sauƙi, ƙira mai daidaituwa da hanyoyin tuntuɓa suna taimaka wa kwastomomi su fahimci tayin.", "Ci gaba yana zuwa ta gwaji, sauraro da ingantawa. Aiki na dindindin yana gina amincewa fiye da magana mai wuce gona da iri."],
    },
    image: blogDigitalOpportunitiesAsset.url,
    author: "Abubakar Alhaji Abubakar",
    publishedAt: "2026-09-25T00:00:00.000Z",
  },
  {
    slug: "ai-assisted-web-design-for-growing-brands",
    title: { en: "AI-assisted web design for growing brands", ar: "تصميم المواقع بمساعدة الذكاء الاصطناعي للعلامات النامية", ha: "Ƙirar yanar gizo da AI ga brand masu girma" },
    category: { en: "AI & Design", ar: "الذكاء الاصطناعي والتصميم", ha: "AI da Ƙira" },
    summary: { en: "Learn how AI tools can streamline research, design, content planning and production while keeping creativity and human judgment at the center.", ar: "تعرّف على كيفية تبسيط أدوات الذكاء الاصطناعي للبحث والتصميم وتخطيط المحتوى والإنتاج مع إبقاء الإبداع والحكم البشري في المركز.", ha: "Koyi yadda kayan AI za su sauƙaƙa bincike, ƙira, tsara abun ciki da samarwa tare da riƙe ƙirƙira da shawarar ɗan adam a tsakiya." },
    body: {
      en: ["AI can speed up research, comparisons and early drafts, but it does not replace understanding the client, the audience or the business context.", "A responsible workflow uses AI as an assistant: define the brief, verify claims, shape the visual direction, review every output and test the final experience on real devices.", "The result should feel clear and human. Visitors should see the service, proof and next action—not the tools used behind the scenes."],
      ar: ["يمكن للذكاء الاصطناعي تسريع البحث والمقارنة والمسودات الأولى، لكنه لا يحل محل فهم العميل والجمهور وسياق العمل.", "يستخدم المسار المسؤول الذكاء الاصطناعي كمساعد: تحديد المطلوب، والتحقق من المعلومات، وصياغة الاتجاه البصري، ومراجعة كل مخرج، واختبار التجربة على أجهزة حقيقية.", "يجب أن تبدو النتيجة واضحة وإنسانية، وأن يرى الزائر الخدمة والدليل والخطوة التالية."],
      ha: ["AI na iya hanzarta bincike da rubutun farko, amma ba zai maye gurbin fahimtar abokin ciniki, masu amfani ko yanayin kasuwanci ba.", "Tsarin aiki mai kyau yana amfani da AI a matsayin mataimaki: a tsara buƙata, a tabbatar da bayanai, a zaɓi hanyar gani, a duba komai sannan a gwada a na’urori na gaske.", "Sakamakon ya kamata ya kasance mai sauƙi kuma na ɗan adam. Mai ziyara ya ga sabis, hujja da mataki na gaba."],
    },
    image: blogAiDesignAsset.url,
    author: "Abubakar Alhaji Abubakar",
    publishedAt: "2026-09-25T00:00:00.000Z",
  },
  {
    slug: "building-a-trustworthy-online-business-presence",
    title: { en: "Building a trustworthy online business presence", ar: "بناء حضور أعمال موثوق على الإنترنت", ha: "Gina kasancewar kasuwanci mai aminci a intanet" },
    category: { en: "Business", ar: "الأعمال", ha: "Kasuwanci" },
    summary: { en: "Explore practical steps to create a strong brand, publish credible content and build an online presence that attracts the right audience and supports long-term growth.", ar: "استكشف خطوات عملية لبناء علامة قوية ونشر محتوى موثوق وتأسيس حضور رقمي يجذب الجمهور المناسب ويدعم النمو طويل المدى.", ha: "Bincika matakai masu amfani don gina brand mai ƙarfi, wallafa ingantaccen abun ciki da ƙirƙirar kasancewa a intanet da ke jawo masu sauraro da suka dace kuma yana tallafa wa ci gaba na dogon lokaci." },
    body: {
      en: ["Trust starts with accuracy. A professional website should describe what is actually available, identify concept work honestly and avoid promises that depend on third parties.", "Clear service pages, useful project details and real contact routes help visitors assess fit before they reach out. Privacy and terms pages should also explain how accounts, messages and documents are handled.", "A dependable website is maintained after launch. Content, links, security and performance need regular review as the organization grows."],
      ar: ["تبدأ الثقة بالدقة. يجب أن يصف الموقع الاحترافي ما هو متاح فعلاً، وأن يوضح الأعمال التجريبية بصدق، وأن يتجنب الوعود التي تعتمد على أطراف أخرى.", "تساعد صفحات الخدمات الواضحة وتفاصيل الأعمال ووسائل التواصل الحقيقية الزائر على تقييم الملاءمة قبل التواصل. كما توضح صفحات الخصوصية والشروط كيفية التعامل مع الحسابات والرسائل والوثائق.", "يحتاج الموقع الموثوق إلى متابعة بعد الإطلاق؛ فالمحتوى والروابط والأمان والأداء تحتاج إلى مراجعة منتظمة."],
      ha: ["Amincewa tana farawa da gaskiya. Gidan yanar gizo na ƙwararru ya bayyana abin da ake bayarwa, ya nuna aikin samfurin a sarari kuma ya guji alkawuran da suka dogara da wasu.", "Shafukan sabis, bayanan ayyuka da hanyoyin tuntuɓa na gaske suna taimaka wa mai ziyara ya fahimci dacewa kafin ya tuntuɓa. Shafukan sirri da sharuɗɗa su kuma bayyana yadda ake kula da asusu, saƙonni da takardu.", "Ana kula da gidan yanar gizo mai aminci bayan ƙaddamarwa. Abun ciki, links, tsaro da sauri suna buƙatar duba lokaci-lokaci."],
    },
    image: blogBusinessAsset.url,
    author: "Abubakar Alhaji Abubakar",
    publishedAt: "2026-09-25T00:00:00.000Z",
  },
];

export function articleBySlug(slug: string) { return articles.find((item) => item.slug === slug); }
