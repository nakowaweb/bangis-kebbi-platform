import type { LanguageCode } from "@/lib/i18n/dictionary";

type L<T> = { en: T } & Partial<Record<Exclude<LanguageCode, "en">, T>>;
export type ServiceDetail = { meaning: L<string>; provide: L<string[]>; useCases: L<string[]>; cta: L<string> };

export const serviceDetails: Record<string, ServiceDetail> = {
  "ai-web-design": {
    meaning: {
      en: "AI Web Design combines careful human design decisions with AI-assisted research, content drafting and visual exploration, so a professional website can be planned and delivered faster without losing quality or clarity.",
      ar: "يجمع تصميم المواقع بمساعدة الذكاء الاصطناعي بين قرارات التصميم البشرية الدقيقة والبحث وصياغة المحتوى والاستكشاف البصري بمساعدة الذكاء الاصطناعي، لتخطيط موقع احترافي وتسليمه أسرع دون فقدان الجودة.",
      ha: "Ƙirar Yanar Gizo da AI tana haɗa shawarwarin ƙira na ɗan adam da bincike, rubutun abun ciki da binciken gani da AI ke taimakawa, don a tsara kuma a kammala gidan yanar gizo cikin sauri ba tare da rasa inganci ba.",
    },
    provide: {
      en: ["AI-assisted research and content planning", "Modern, responsive page design", "Brand-consistent visual direction", "Clear page structure and calls to action", "SEO-ready headings and page metadata", "Launch-ready website build"],
      ar: ["بحث وتخطيط محتوى بمساعدة الذكاء الاصطناعي", "تصميم صفحات حديث ومتجاوب", "اتجاه بصري متسق مع العلامة", "هيكل صفحات واضح ودعوات لاتخاذ إجراء", "عناوين وبيانات صفحات جاهزة لمحركات البحث", "موقع جاهز للإطلاق"],
      ha: ["Bincike da tsara abun ciki da AI", "Ƙirar shafuka ta zamani mai daidaituwa", "Salon gani daidai da brand", "Tsarin shafi da maɓallan aiki a bayyane", "Kanun labarai da bayanan SEO", "Gidan yanar gizo shirye don ƙaddamarwa"],
    },
    useCases: {
      en: ["A new business needing a credible website quickly", "A professional refreshing an outdated personal site", "An organization launching a new service or campaign page"],
      ar: ["نشاط جديد يحتاج موقعاً موثوقاً بسرعة", "مهني يجدد موقعاً شخصياً قديماً", "مؤسسة تطلق صفحة خدمة أو حملة جديدة"],
      ha: ["Sabon kasuwanci da ke buƙatar gidan yanar gizo cikin sauri", "Ƙwararre da ke sabunta tsohon shafinsa", "Ƙungiya da ke ƙaddamar da sabon sabis ko kamfen"],
    },
    cta: { en: "Start My AI-Designed Website", ar: "ابدأ موقعي المصمم بالذكاء الاصطناعي", ha: "Fara Gidan Yanar Gizona da AI" },
  },
  "web-development": {
    meaning: {
      en: "I build modern websites and web applications around real business and personal requirements, from professional websites to database-connected platforms and custom digital systems.",
      ar: "أبني مواقع وتطبيقات ويب حديثة حول متطلبات حقيقية للأعمال والأفراد، من المواقع الاحترافية إلى المنصات المرتبطة بقواعد البيانات والأنظمة الرقمية المخصصة.",
      ha: "Ina gina gidajen yanar gizo da manhajoji na zamani bisa ainihin bukatun kasuwanci da na kai, daga shafukan ƙwararru zuwa dandali masu haɗin bayanai da tsarin dijital na musamman.",
    },
    provide: {
      en: ["Business websites", "Personal websites", "Portfolio websites", "Database-driven applications", "Member platforms", "Authentication systems", "Admin dashboards", "CMS systems", "Custom web applications", "Responsive websites", "Custom workflows"],
      ar: ["مواقع الأعمال", "المواقع الشخصية", "مواقع معارض الأعمال", "تطبيقات قواعد البيانات", "منصات الأعضاء", "أنظمة تسجيل الدخول", "لوحات الإدارة", "أنظمة إدارة المحتوى", "تطبيقات ويب مخصصة", "مواقع متجاوبة", "مسارات عمل مخصصة"],
      ha: ["Yanar gizon kasuwanci", "Yanar gizon kai", "Yanar gizon nuna ayyuka", "Manhajoji masu bayanai", "Dandalin mambobi", "Tsarin shiga", "Dashboard na gudanarwa", "Tsarin CMS", "Manhajojin yanar gizo na musamman", "Yanar gizo masu daidaituwa", "Tsarin aiki na musamman"],
    },
    useCases: {
      en: ["A member portal with secure sign-in and personal dashboards", "A company website with an editable content system", "An internal tool that replaces spreadsheets with a clear workflow"],
      ar: ["بوابة أعضاء بتسجيل دخول آمن ولوحات شخصية", "موقع شركة بنظام محتوى قابل للتحرير", "أداة داخلية تستبدل الجداول بمسار عمل واضح"],
      ha: ["Dandalin mamba mai shiga lafiya da dashboard na kai", "Yanar gizon kamfani mai tsarin abun ciki", "Kayan aiki na ciki da ke maye gurbin spreadsheet"],
    },
    cta: { en: "Build My Website or Web App", ar: "ابنِ موقعي أو تطبيقي", ha: "Gina Yanar Gizona ko Manhaja" },
  },
  "ui-ux-design": {
    meaning: {
      en: "UI/UX Design shapes how people move through a website or app: what they see first, how they find information and how easily they complete important tasks on any screen.",
      ar: "يحدد تصميم UI/UX كيف يتنقل الناس في الموقع أو التطبيق: ما يرونه أولاً، وكيف يجدون المعلومات، ومدى سهولة إنجاز المهام المهمة على أي شاشة.",
      ha: "Ƙirar UI/UX tana tsara yadda mutane ke tafiya cikin shafi ko manhaja: abin da suke gani farko, yadda suke samun bayani da sauƙin kammala ayyuka a kowane allo.",
    },
    provide: {
      en: ["User flows", "Mobile-first UX", "Interface design", "Information architecture", "Responsive layouts", "Accessibility-conscious design", "Wireframes and prototypes", "Clear navigation", "Professional visual hierarchy"],
      ar: ["مسارات المستخدم", "تجربة تبدأ من الجوال", "تصميم الواجهات", "هندسة المعلومات", "تخطيطات متجاوبة", "تصميم يراعي سهولة الوصول", "مخططات ونماذج أولية", "تنقل واضح", "تسلسل بصري احترافي"],
      ha: ["Tafiyar mai amfani", "UX daga wayar hannu", "Ƙirar fuska", "Tsarin bayanai", "Shimfiɗa mai daidaituwa", "Ƙira mai la'akari da samun dama", "Wireframe da samfuri", "Kewayawa a bayyane", "Tsarin gani na ƙwararru"],
    },
    useCases: {
      en: ["Redesigning a confusing sign-up or booking journey", "Planning a new app before development starts", "Improving mobile usability of an existing website"],
      ar: ["إعادة تصميم رحلة تسجيل أو حجز مربكة", "تخطيط تطبيق جديد قبل التطوير", "تحسين سهولة استخدام موقع قائم على الجوال"],
      ha: ["Sake ƙirar hanyar rajista ko booking mai rikitarwa", "Tsara sabuwar manhaja kafin ginawa", "Inganta amfani da shafi a wayar hannu"],
    },
    cta: { en: "Design My User Experience", ar: "صمم تجربة المستخدم", ha: "Ƙira Kwarewar Mai Amfani" },
  },
  "wordpress-development": {
    meaning: {
      en: "WordPress Development delivers professional websites on a widely used platform that you can update yourself, extend with trusted plugins and keep maintained over time.",
      ar: "يقدم تطوير ووردبريس مواقع احترافية على منصة واسعة الاستخدام يمكنك تحديثها بنفسك وتوسيعها بإضافات موثوقة وصيانتها مع الوقت.",
      ha: "Haɓaka WordPress yana ba da gidajen yanar gizo na ƙwararru a kan dandali da aka fi amfani da shi, wanda za ka iya sabuntawa da kanka da faɗaɗawa da plugin amintattu.",
    },
    provide: {
      en: ["Business websites", "Personal websites", "Landing pages", "Blog websites", "CMS websites", "Theme customization", "Plugin integration", "Responsive optimization", "Website maintenance"],
      ar: ["مواقع الأعمال", "المواقع الشخصية", "صفحات الهبوط", "مواقع المدونات", "مواقع إدارة المحتوى", "تخصيص القوالب", "دمج الإضافات", "تحسين التجاوب", "صيانة المواقع"],
      ha: ["Yanar gizon kasuwanci", "Yanar gizon kai", "Shafukan saukowa", "Yanar gizon blog", "Yanar gizon CMS", "Gyaran jigo (theme)", "Haɗa plugin", "Inganta daidaituwa", "Kula da yanar gizo"],
    },
    useCases: {
      en: ["A small business that wants to edit its own pages", "A blog or news site with categories and authors", "A campaign landing page connected to forms"],
      ar: ["نشاط صغير يريد تعديل صفحاته بنفسه", "مدونة أو موقع أخبار بتصنيفات وكتّاب", "صفحة هبوط لحملة مرتبطة بنماذج"],
      ha: ["Ƙaramin kasuwanci da ke son gyara shafukansa", "Blog ko shafin labarai mai rukunoni", "Shafin kamfen da aka haɗa da fom"],
    },
    cta: { en: "Build My WordPress Website", ar: "ابنِ موقعي على ووردبريس", ha: "Gina Yanar Gizona na WordPress" },
  },
  "digital-business-solutions": {
    meaning: {
      en: "Digital Business Solutions help a business work better online: a clear presence, organized information and simple digital workflows that save time and support growth.",
      ar: "تساعد حلول الأعمال الرقمية النشاط التجاري على العمل بشكل أفضل عبر الإنترنت: حضور واضح ومعلومات منظمة ومسارات عمل رقمية بسيطة توفر الوقت.",
      ha: "Hanyoyin Kasuwanci na Dijital suna taimaka wa kasuwanci aiki mafi kyau a intanet: kasancewa a bayyane, bayanai masu tsari da tsarin aiki mai sauƙi.",
    },
    provide: {
      en: ["Business websites", "Online presence", "Business information systems", "CMS", "Online forms", "Digital workflows", "Member systems", "Website integrations", "Continuous digital improvement"],
      ar: ["مواقع الأعمال", "الحضور الرقمي", "أنظمة معلومات الأعمال", "إدارة المحتوى", "النماذج الإلكترونية", "مسارات العمل الرقمية", "أنظمة الأعضاء", "تكاملات المواقع", "تحسين رقمي مستمر"],
      ha: ["Yanar gizon kasuwanci", "Kasancewa a intanet", "Tsarin bayanan kasuwanci", "CMS", "Fom na intanet", "Tsarin aiki na dijital", "Tsarin mambobi", "Haɗin yanar gizo", "Ci gaba da ingantawa"],
    },
    useCases: {
      en: ["Replacing paper enquiry forms with online forms", "Giving customers or members a secure online area", "Connecting a website to existing business tools"],
      ar: ["استبدال النماذج الورقية بنماذج إلكترونية", "منح العملاء أو الأعضاء مساحة آمنة", "ربط الموقع بأدوات العمل الحالية"],
      ha: ["Maye gurbin fom na takarda da na intanet", "Ba kwastomomi ko mambobi wuri mai tsaro", "Haɗa yanar gizo da kayan aikin kasuwanci"],
    },
    cta: { en: "Improve My Business Online", ar: "طوّر عملي رقمياً", ha: "Inganta Kasuwancina a Intanet" },
  },
  "website-maintenance": {
    meaning: {
      en: "Website Maintenance keeps a website current, functional and useful after launch, so content stays accurate, problems are fixed quickly and the site keeps improving.",
      ar: "تحافظ صيانة المواقع على حداثة الموقع وعمله وفائدته بعد الإطلاق، ليبقى المحتوى دقيقاً وتُحل المشكلات بسرعة ويستمر التحسين.",
      ha: "Kula da Yanar Gizo yana sa shafi ya kasance na zamani, yana aiki kuma mai amfani bayan ƙaddamarwa, abun ciki ya zama daidai kuma a gyara matsaloli cikin sauri.",
    },
    provide: {
      en: ["Ongoing website updates", "Content updates", "Image and media updates", "Technical troubleshooting", "Performance improvements", "Security-conscious maintenance", "CMS updates", "Broken-link checks", "Minor UI improvements", "Feature improvements", "Backup support", "General technical support"],
      ar: ["تحديثات مستمرة للموقع", "تحديث المحتوى", "تحديث الصور والوسائط", "حل المشكلات التقنية", "تحسين الأداء", "صيانة تراعي الأمان", "تحديث نظام المحتوى", "فحص الروابط المعطلة", "تحسينات بسيطة للواجهة", "تحسين الميزات", "دعم النسخ الاحتياطي", "دعم تقني عام"],
      ha: ["Sabunta shafi a kai a kai", "Sabunta abun ciki", "Sabunta hotuna da kafofin watsa labarai", "Warware matsalolin fasaha", "Inganta sauri", "Kulawa mai la'akari da tsaro", "Sabunta CMS", "Duba hanyoyin da suka karye", "Ƙananan gyare-gyaren fuska", "Inganta fasali", "Tallafin ajiyar bayanai", "Tallafin fasaha gabaɗaya"],
    },
    useCases: {
      en: ["Monthly content and image updates", "Fixing errors after a hosting or plugin change", "Keeping a CMS and its features up to date"],
      ar: ["تحديث المحتوى والصور شهرياً", "إصلاح الأخطاء بعد تغيير الاستضافة أو الإضافات", "إبقاء نظام المحتوى وميزاته محدثة"],
      ha: ["Sabunta abun ciki da hotuna kowane wata", "Gyara kurakurai bayan canjin hosting ko plugin", "Ci gaba da sabunta CMS da fasalinsa"],
    },
    cta: { en: "Maintain My Website", ar: "اعتنِ بموقعي", ha: "Kula da Yanar Gizona" },
  },
};
