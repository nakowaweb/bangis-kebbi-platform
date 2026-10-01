import { defaultLanguage, type LanguageCode } from "@/lib/i18n/dictionary";

type Entry = { title: string; description: string };

/**
 * Localized titles and meta descriptions for the fixed public pages.
 * Detail pages take their wording from the translated CMS entry instead.
 */
const seoText: Record<string, Partial<Record<LanguageCode, Entry>>> = {
  "/": {
    en: {
      title: "BangisKebbi.com — Ideas, Technology, Business and People",
      description: "BangisKebbi.com is a global platform for ideas, technology, business and people, based in Kebbi State, Nigeria.",
    },
    ar: {
      title: "بانجيس كيبي — أفكار وتقنية وأعمال وأشخاص",
      description: "بانجيس كيبي منصة عالمية للأفكار والتقنية والأعمال والأشخاص، ومقرها ولاية كيبي، نيجيريا.",
    },
    ha: {
      title: "BangisKebbi.com — Ra'ayoyi, Fasaha, Kasuwanci da Mutane",
      description: "BangisKebbi.com dandali ne na duniya don ra'ayoyi, fasaha, kasuwanci da mutane, tare da cibiya a Jihar Kebbi, Najeriya.",
    },
  },
  "/about": {
    en: { title: "About — BangisKebbi.com", description: "Learn about BangisKebbi.com, our purpose, our work and the people behind the platform." },
    ar: { title: "من نحن — بانجيس كيبي", description: "تعرّف على بانجيس كيبي، وغايتنا، وأعمالنا، والأشخاص الذين يقفون خلف المنصة." },
    ha: { title: "Game da Mu — BangisKebbi.com", description: "Ka san BangisKebbi.com, manufarmu, aikinmu da mutanen da ke bayan dandalin." },
  },
  "/services": {
    en: { title: "Services — AI Web Design, Web Development & UI/UX", description: "Explore Bangis Kebbi services including AI web design, web development, UI/UX design, WordPress and website maintenance." },
    ar: { title: "الخدمات — تصميم وتطوير المواقع وتجربة المستخدم", description: "استعرض خدمات بانجيس كيبي: تصميم المواقع بالذكاء الاصطناعي، تطوير المواقع، تصميم تجربة المستخدم، ووردبريس والصيانة." },
    ha: { title: "Ayyuka — Zanen Yanar Gizo, Ci gaba da UI/UX", description: "Duba ayyukan Bangis Kebbi: zanen yanar gizo da AI, gina gidan yanar gizo, UI/UX, WordPress da kulawa." },
  },
  "/projects": {
    en: { title: "Projects — BangisKebbi.com", description: "Selected BangisKebbi.com projects across technology, design and digital business." },
    ar: { title: "المشاريع — بانجيس كيبي", description: "مختارات من مشاريع بانجيس كيبي في التقنية والتصميم والأعمال الرقمية." },
    ha: { title: "Ayyukan Da Aka Yi — BangisKebbi.com", description: "Zaɓaɓɓun ayyukan BangisKebbi.com a fasaha, zane da kasuwancin dijital." },
  },
  "/blog": {
    en: { title: "News and Update — BangisKebbi.com", description: "Articles and updates from BangisKebbi.com on ideas, technology, business and people." },
    ar: { title: "المدونة والأخبار — بانجيس كيبي", description: "مقالات وتحديثات من بانجيس كيبي حول الأفكار والتقنية والأعمال والأشخاص." },
    ha: { title: "Bulogi da Labarai — BangisKebbi.com", description: "Labarai da sabuntawa daga BangisKebbi.com kan ra'ayoyi, fasaha, kasuwanci da mutane." },
  },
  "/business": {
    en: { title: "Business — BangisKebbi.com", description: "Professional services, useful connections and legitimate business opportunities from BangisKebbi.com." },
    ar: { title: "الأعمال — بانجيس كيبي", description: "معلومات الأعمال من بانجيس كيبي. هذا ليس عرض استثمار ولا خدمة مالية." },
    ha: { title: "Kasuwanci — BangisKebbi.com", description: "Bayanin kasuwanci daga BangisKebbi.com. Wannan ba tayin zuba jari ba ne kuma ba sabis na kuɗi ba." },
  },
  "/umrah": {
    en: { title: "Umrah Information — BangisKebbi.com", description: "Public Umrah information, steps, requirements and frequently asked questions from BangisKebbi.com." },
    ar: { title: "معلومات العمرة — بانجيس كيبي", description: "معلومات العمرة العامة والخطوات والمتطلبات والأسئلة الشائعة من بانجيس كيبي." },
    ha: { title: "Bayanin Umrah — BangisKebbi.com", description: "Bayanin Umrah na jama'a, matakai, buƙatu da tambayoyin da ake yawan yi daga BangisKebbi.com." },
  },
  "/foundation": {
    en: { title: "BK Foundation — Humanitarian Work", description: "BK Foundation focuses on practical help, dignity and accountable community updates." },
    ar: { title: "مبادرة BK لدعم المجتمع — العمل الإنساني", description: "تركز مبادرة BK لدعم المجتمع على المساعدة العملية والكرامة والتحديثات المجتمعية المسؤولة." },
    ha: { title: "BK Foundation — Aikin Jin Kai", description: "BK Foundation na mayar da hankali kan taimako mai amfani, mutunci da bayanan al’umma masu gaskiya." },
  },
  "/community": {
    en: { title: "Community — BangisKebbi.com", description: "The BangisKebbi.com community for people who build with ideas, technology and business." },
    ar: { title: "المجتمع — بانجيس كيبي", description: "مجتمع بانجيس كيبي لمن يبنون بالأفكار والتقنية والأعمال." },
    ha: { title: "Al'umma — BangisKebbi.com", description: "Al'ummar BangisKebbi.com ga mutanen da ke gina da ra'ayoyi, fasaha da kasuwanci." },
  },
  "/contact": {
    en: { title: "Contact — BangisKebbi.com", description: "Contact BangisKebbi.com in Kebbi State, Nigeria for enquiries about services, projects and the community." },
    ar: { title: "اتصل بنا — بانجيس كيبي", description: "تواصل مع بانجيس كيبي في ولاية كيبي، نيجيريا للاستفسار عن الخدمات والمشاريع والمجتمع." },
    ha: { title: "Tuntuɓe Mu — BangisKebbi.com", description: "Tuntuɓi BangisKebbi.com a Jihar Kebbi, Najeriya don tambayoyi kan ayyuka, aiyukan da al'umma." },
  },
  "/privacy": {
    en: { title: "Privacy Policy — BangisKebbi.com", description: "How BangisKebbi.com collects, uses and protects personal information." },
    ar: { title: "سياسة الخصوصية — بانجيس كيبي", description: "كيف يجمع بانجيس كيبي المعلومات الشخصية ويستخدمها ويحميها." },
    ha: { title: "Manufar Sirri — BangisKebbi.com", description: "Yadda BangisKebbi.com ke tattarawa, amfani da kuma kare bayanan sirri." },
  },
  "/terms": {
    en: { title: "Terms of Use — BangisKebbi.com", description: "The terms that apply when you use BangisKebbi.com." },
    ar: { title: "شروط الاستخدام — بانجيس كيبي", description: "الشروط التي تسري عند استخدامك لموقع بانجيس كيبي." },
    ha: { title: "Sharuɗɗan Amfani — BangisKebbi.com", description: "Sharuɗɗan da ke aiki lokacin da kake amfani da BangisKebbi.com." },
  },
  "/refund-policy": {
    en: { title: "Refund Policy — BangisKebbi.com", description: "The refund policy that applies to BangisKebbi.com services." },
    ar: { title: "سياسة الاسترداد — بانجيس كيبي", description: "سياسة الاسترداد التي تسري على خدمات بانجيس كيبي." },
    ha: { title: "Manufar Mayar da Kuɗi — BangisKebbi.com", description: "Manufar mayar da kuɗi da ke aiki kan ayyukan BangisKebbi.com." },
  },
  "/cv": {
    en: { title: "Professional CV — Abubakar Alhaji Abubakar", description: "Professional profile, digital capabilities, selected work and availability in Kebbi State, Nigeria." },
    ar: { title: "السيرة المهنية — أبوبكر الحاج أبوبكر", description: "الملف المهني والقدرات الرقمية والأعمال المختارة والتوفر في ولاية كيبي، نيجيريا." },
    ha: { title: "Tarihin Sana'a — Abubakar Alhaji Abubakar", description: "Bayanan sana'a, ƙwarewar dijital, zaɓaɓɓun ayyuka da samuwa a Jihar Kebbi, Najeriya." },
  },
};

/** Localized title/description for a fixed public page, falling back to English. */
export function pageSeo(path: string, language: LanguageCode, fallback: Entry): Entry {
  const record = seoText[path];
  if (!record) return fallback;
  return record[language] ?? record[defaultLanguage] ?? fallback;
}
