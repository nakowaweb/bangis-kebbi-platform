import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/legal-page";
import { pageHead } from "@/lib/seo";
import { getPublicEntry } from "@/lib/content.functions";
import type { LanguageCode } from "@/lib/i18n/dictionary";

export const Route = createFileRoute("/terms")({
  head: ({ match }) =>
    pageHead({ search: match.search,
      title: "Terms — BangisKebbi.com",
      description: "Terms governing use of BangisKebbi.com services, content, accounts, community and Umrah support information.",
      path: "/terms",
    }),
  loaderDeps: (opts) => ({ lang: ((opts.search as { lang?: LanguageCode }).lang ?? "en") as LanguageCode }),
  loader: ({ deps }) => getPublicEntry({ data: { contentType: "footer", slug: "terms-of-use", language: deps.lang } }),
  component: TermsPage,
});

function TermsPage() {
  return <LegalPage copy={copy} managed={Route.useLoaderData()} />;
}

const shared = {
  en: [
    { title: "Using the website", body: "Use BangisKebbi.com lawfully and respectfully. Do not attempt unauthorized access, interfere with the service, misuse member areas or submit false or harmful material." },
    { title: "Content and intellectual property", body: "Site content, branding and original materials remain the property of their respective owners. You may view and share public links, but may not copy or present the work as your own without permission." },
    { title: "Services and project discussions", body: "Website descriptions are general information, not a binding quotation. Scope, timing, responsibilities and fees are agreed separately before client work begins." },
    { title: "Umrah support", body: "The Umrah Support Program helps organize information, applications and updates. BangisKebbi.com is not a visa authority, embassy, airline or licensed travel provider. Approval, travel availability and third-party services are never guaranteed." },
    { title: "Accounts and community", body: "You are responsible for accurate account information and protecting your login. Access may be restricted where activity threatens users, privacy, security or lawful operation." },
    { title: "Availability and changes", body: "We aim to keep information accurate and services available, but maintenance or third-party failures may cause interruption. These terms may be updated as services change; continued use means the current terms apply." },
  ],
  ar: [
    { title: "استخدام الموقع", body: "استخدم BangisKebbi.com بصورة قانونية ومحترمة. لا تحاول الوصول غير المصرح به أو تعطيل الخدمة أو إساءة استخدام مناطق الأعضاء أو إرسال مواد كاذبة أو ضارة." },
    { title: "المحتوى والملكية الفكرية", body: "يبقى محتوى الموقع وهويته ومواده الأصلية ملكاً لأصحابها. يمكنك مشاهدة الروابط العامة ومشاركتها، لكن لا يجوز نسخ العمل أو نسبه إليك دون إذن." },
    { title: "الخدمات ومناقشة المشاريع", body: "أوصاف الخدمات معلومات عامة وليست عرض سعر ملزماً. يُتفق على النطاق والمدة والمسؤوليات والرسوم بصورة منفصلة قبل بدء العمل." },
    { title: "دعم العمرة", body: "يساعد برنامج دعم العمرة على تنظيم المعلومات والطلبات والتحديثات. BangisKebbi.com ليس جهة تأشيرات أو سفارة أو شركة طيران أو مزود سفر مرخصاً، ولا يضمن الموافقة أو توفر السفر أو خدمات الأطراف الأخرى." },
    { title: "الحسابات والمجتمع", body: "أنت مسؤول عن دقة معلومات حسابك وحماية تسجيل الدخول. قد يُقيّد الوصول إذا هدد النشاط المستخدمين أو الخصوصية أو الأمان أو التشغيل القانوني." },
    { title: "التوفر والتغييرات", body: "نسعى لدقة المعلومات واستمرار الخدمة، لكن الصيانة أو أعطال الأطراف الأخرى قد تسبب انقطاعاً. قد تتغير هذه الشروط مع تغير الخدمات، ويخضع استمرار الاستخدام للنسخة الحالية." },
  ],
  ha: [
    { title: "Amfani da shafin", body: "Yi amfani da BangisKebbi.com bisa doka da mutunci. Kada ka nemi shiga ba tare da izini ba, ka hana aiki, ka yi amfani da wurin mamba ba daidai ba ko ka tura bayanin ƙarya ko mai cutarwa." },
    { title: "Abun ciki da mallaka", body: "Abun ciki, alama da kayan asali mallakin masu su ne. Za ka iya dubawa da raba links na jama’a, amma ba za ka kwafi aiki ko nuna naka ba tare da izini ba." },
    { title: "Ayyuka da tattaunawar project", body: "Bayanin sabis na gaba ɗaya ne, ba farashi mai ɗaurewa ba. Za a amince da iyaka, lokaci, nauyi da kuɗi daban kafin aiki ya fara." },
    { title: "Tallafin Umrah", body: "Shirin Tallafin Umrah yana taimaka wa shirya bayanai, aikace-aikace da sabuntawa. BangisKebbi.com ba hukumar visa, ofishin jakadanci, kamfanin jirgi ko mai ba da tafiya da lasisi ba ne. Ba a bada tabbacin amincewa ko sabis na wani ba." },
    { title: "Asusu da al’umma", body: "Kai ke da alhakin ingancin bayanin asusunka da kare shigarka. Za a iya hana shiga idan aiki ya barazana ga mutane, sirri, tsaro ko doka." },
    { title: "Samuwar sabis da canje-canje", body: "Muna ƙoƙarin kiyaye bayanai da sabis, amma gyara ko matsalar wani na iya katse aiki. Za a iya sabunta waɗannan sharuɗɗa yayin da sabis ya canza." },
  ],
};
const copy = {
  en: { eyebrow: "Terms", title: "Terms of Use", description: "The conditions for using BangisKebbi.com and its public and member services.", updated: "Effective: 2026", sections: shared.en },
  ar: { eyebrow: "الشروط", title: "شروط الاستخدام", description: "الشروط المنظمة لاستخدام BangisKebbi.com وخدماته العامة وخدمات الأعضاء.", updated: "سارية من: 2026", sections: shared.ar },
  ha: { eyebrow: "Sharuɗɗa", title: "Sharuɗɗan Amfani", description: "Ka’idojin amfani da BangisKebbi.com da ayyukan jama’a da na mamba.", updated: "Ta fara aiki: 2026", sections: shared.ha },
};
