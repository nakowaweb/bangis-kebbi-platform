import { createFileRoute } from "@tanstack/react-router";

import { SectionShell } from "@/components/platform-sections";
import { pageHead } from "@/lib/seo";
import { LegalPage } from "@/components/legal-page";
import { getPublicEntry } from "@/lib/content.functions";
import type { LanguageCode } from "@/lib/i18n/dictionary";

export const Route = createFileRoute("/privacy")({
  head: ({ match }) =>
    pageHead({ search: match.search,
      title: "Privacy Policy — BangisKebbi.com",
      description: "Privacy principles for BangisKebbi.com member accounts, contact messages, applications and future private documents.",
      path: "/privacy",
    }),
  loaderDeps: (opts) => ({ lang: ((opts.search as { lang?: LanguageCode }).lang ?? "en") as LanguageCode }),
  loader: ({ deps }) => getPublicEntry({ data: { contentType: "footer", slug: "privacy-policy", language: deps.lang } }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return <LegalPage copy={copy} managed={Route.useLoaderData()} />;
}

const copy = {
  en: { eyebrow: "Privacy", title: "Privacy Policy", description: "How BangisKebbi.com collects, uses and protects information.", updated: "Effective: 2026", sections: [
    { title: "Information we receive", body: "We may receive account details, contact messages, language preferences and information you submit through member features. Umrah applicants may submit the three requested document types through private authenticated access." },
    { title: "How information is used", body: "Information is used to operate accounts, answer enquiries, review applications, provide status updates, maintain security and improve the website. We do not sell personal information." },
    { title: "Private documents", body: "Member documents are stored privately. Access is limited to the member who submitted them and authorized administrators performing a legitimate review. Temporary access links expire shortly after creation." },
    { title: "Sharing and service providers", body: "Necessary hosting, authentication and communication providers may process limited information to operate the service. Umrah travel, visa and service providers are independent parties and receive information only when required for an agreed process." },
    { title: "Retention and choices", body: "Records are retained only as reasonably needed for the stated purpose, security and applicable obligations. You may contact us to request access, correction or deletion, subject to legitimate record-keeping needs." },
    { title: "Security and contact", body: "Reasonable access controls and monitoring are used, but no online system can promise absolute security. Contact BangisKebbi.com through the published Contact page with privacy questions." },
  ]},
  ar: { eyebrow: "الخصوصية", title: "سياسة الخصوصية", description: "كيفية جمع المعلومات واستخدامها وحمايتها في BangisKebbi.com.", updated: "سارية من: 2026", sections: [
    { title: "المعلومات التي نستلمها", body: "قد نستلم بيانات الحساب ورسائل التواصل وتفضيلات اللغة والمعلومات التي ترسلها عبر خصائص الأعضاء. ويمكن لمتقدمي العمرة رفع أنواع الوثائق الثلاثة المطلوبة عبر وصول خاص وآمن." },
    { title: "استخدام المعلومات", body: "نستخدم المعلومات لتشغيل الحسابات والرد على الاستفسارات ومراجعة الطلبات وإرسال تحديثات الحالة والحفاظ على الأمان وتحسين الموقع. لا نبيع المعلومات الشخصية." },
    { title: "الوثائق الخاصة", body: "تُحفظ وثائق الأعضاء بصورة خاصة، ويقتصر الوصول عليها على صاحبها والمسؤولين المخولين للمراجعة. وتنتهي روابط الوصول المؤقتة بعد مدة قصيرة." },
    { title: "المشاركة ومقدمو الخدمات", body: "قد يعالج مقدمو الاستضافة والمصادقة والاتصال المعلومات اللازمة لتشغيل الخدمة. ومقدمو السفر والتأشيرات وخدمات العمرة جهات مستقلة ولا تُشارك المعلومات معهم إلا عند الحاجة لمسار متفق عليه." },
    { title: "الاحتفاظ والاختيارات", body: "نحتفظ بالسجلات للمدة المعقولة اللازمة للغرض والأمان والالتزامات ذات الصلة. يمكنك التواصل معنا لطلب الوصول أو التصحيح أو الحذف، مع مراعاة احتياجات حفظ السجلات المشروعة." },
    { title: "الأمان والتواصل", body: "نستخدم ضوابط وصول ومتابعة معقولة، لكن لا يمكن لأي نظام على الإنترنت ضمان أمان مطلق. تواصل معنا عبر صفحة الاتصال لأي سؤال عن الخصوصية." },
  ]},
  ha: { eyebrow: "Sirri", title: "Manufar Sirri", description: "Yadda BangisKebbi.com ke karɓa, amfani da kare bayanai.", updated: "Ta fara aiki: 2026", sections: [
    { title: "Bayanan da muke karɓa", body: "Za mu iya karɓar bayanan asusu, saƙonnin tuntuɓa, zaɓin harshe da bayanan da ka shigar a wurin mamba. Mai neman Umrah zai iya tura nau’ikan takardu uku da ake buƙata ta hanya mai zaman kanta." },
    { title: "Yadda ake amfani da bayanai", body: "Ana amfani da bayanai don gudanar da asusu, amsa tambaya, duba aikace-aikace, bayar da sabuntawa, kiyaye tsaro da inganta shafin. Ba ma sayar da bayanan mutum." },
    { title: "Takardu masu zaman kansu", body: "Ana ajiye takardun mamba a sirrance. Mai takardar da ma’aikacin da aka ba izinin duba ta ne kawai za su iya shiga. Link na wucin gadi yana ƙarewa cikin ɗan lokaci." },
    { title: "Rabawa da masu ba da sabis", body: "Masu ba da hosting, shiga da sadarwa na iya sarrafa bayanan da ake buƙata don gudanar da sabis. Masu tafiya, visa da sabis na Umrah hukumomi ne masu zaman kansu, kuma ana ba su bayanai ne kawai idan tsarin da aka amince ya buƙata." },
    { title: "Riƙewa da zaɓinka", body: "Ana riƙe bayanai gwargwadon lokacin da ake buƙata don manufar, tsaro da alhakin da ya dace. Za ka iya tuntuɓar mu don ganin, gyara ko share bayananka bisa bukatun riƙe bayanai masu dacewa." },
    { title: "Tsaro da tuntuɓa", body: "Muna amfani da hanyoyin kariya masu dacewa, amma babu tsarin intanet da zai bada cikakkiyar tabbacin tsaro. Tuntuɓe mu ta shafin Contact don tambayar sirri." },
  ]},
};
