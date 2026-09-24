import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/legal-page";
import { pageHead } from "@/lib/seo";
import { getPublicEntry } from "@/lib/content.functions";
import type { LanguageCode } from "@/lib/i18n/dictionary";

export const Route = createFileRoute("/refund-policy")({
  head: ({ match }) =>
    pageHead({ search: match.search,
      title: "Refund Policy — BangisKebbi.com",
      description: "Refund policy for separately agreed professional services and eligible third-party service arrangements.",
      path: "/refund-policy",
    }),
  loaderDeps: (opts) => ({ lang: ((opts.search as { lang?: LanguageCode }).lang ?? "en") as LanguageCode }),
  loader: ({ deps }) => getPublicEntry({ data: { contentType: "footer", slug: "refund-policy", language: deps.lang } }),
  component: RefundPage,
});

function RefundPage() {
  return <LegalPage copy={copy} managed={Route.useLoaderData()} />;
}

const copy = {
  en: { eyebrow: "Policy", title: "Refund Policy", description: "How refund requests are considered for separately agreed services.", updated: "Effective: 2026", sections: [
    { title: "No checkout on this website", body: "BangisKebbi.com does not currently collect payments through the public website, member dashboard, Umrah application or BK Foundations pages." },
    { title: "Professional services", body: "If a client engagement is agreed separately, its written proposal or agreement sets the price, milestones, cancellation terms and refund eligibility. Work already completed, accepted milestones and non-recoverable costs may not be refundable." },
    { title: "Umrah and third-party services", body: "Travel, visa, accommodation and related services are provided by independent providers under their own rules. Any eligible refund depends on the provider’s written terms, work completed and costs already committed. Visa decisions and processing delays are outside BangisKebbi.com’s control." },
    { title: "BK Foundations", body: "The public Foundation pages do not process contributions. If a future support arrangement is introduced, its specific terms will be presented before any transaction." },
    { title: "Requesting a review", body: "Contact us with your name, the relevant written agreement or reference and the reason for your request. We will acknowledge it, verify the circumstances and explain the outcome. This policy does not limit rights that cannot lawfully be excluded." },
  ]},
  ar: { eyebrow: "السياسة", title: "سياسة الاسترداد", description: "كيفية النظر في طلبات الاسترداد للخدمات المتفق عليها بصورة منفصلة.", updated: "سارية من: 2026", sections: [
    { title: "لا يوجد دفع عبر الموقع", body: "لا يجمع BangisKebbi.com حالياً مدفوعات عبر الموقع العام أو لوحة الأعضاء أو طلب العمرة أو صفحات BK Foundations." },
    { title: "الخدمات المهنية", body: "إذا تم الاتفاق على عمل مع عميل بصورة منفصلة، يحدد العرض أو الاتفاق المكتوب السعر والمراحل والإلغاء وأهلية الاسترداد. وقد لا تكون الأعمال المنجزة والمراحل المقبولة والتكاليف غير القابلة للاسترداد قابلة للرد." },
    { title: "العمرة وخدمات الأطراف الأخرى", body: "يقدم السفر والتأشيرات والإقامة والخدمات المرتبطة مزودون مستقلون وفق شروطهم. ويتوقف أي استرداد مؤهل على شروط المزود والعمل المنجز والتكاليف الملتزم بها. قرارات التأشيرة والتأخير خارج سيطرة BangisKebbi.com." },
    { title: "BK Foundations", body: "لا تعالج صفحات المؤسسة العامة أي مساهمات. وإذا أضيف ترتيب دعم مستقبلاً فستظهر شروطه المحددة قبل أي معاملة." },
    { title: "طلب المراجعة", body: "تواصل معنا باسمك والاتفاق أو المرجع ذي الصلة وسبب الطلب. سنؤكد الاستلام ونتحقق من الظروف ونوضح النتيجة. لا تحد هذه السياسة من الحقوق التي لا يجوز استبعادها قانوناً." },
  ]},
  ha: { eyebrow: "Manufa", title: "Manufar Mayar da Kuɗi", description: "Yadda ake duba buƙatar mayar da kuɗi ga sabis da aka amince daban.", updated: "Ta fara aiki: 2026", sections: [
    { title: "Babu biyan kuɗi a shafin", body: "BangisKebbi.com ba ya karɓar biyan kuɗi yanzu ta shafin jama’a, dashboard na mamba, aikace-aikacen Umrah ko shafukan BK Foundations." },
    { title: "Ayyukan ƙwararru", body: "Idan an amince da aikin kwastoma daban, rubutacciyar yarjejeniya za ta bayyana farashi, matakai, sokewa da damar mayar da kuɗi. Aikin da aka riga aka yi, matakin da aka karɓa da kuɗin da ba za a dawo da shi ba na iya zama ba a mayarwa." },
    { title: "Umrah da sabis na wasu", body: "Masu ba da tafiya, visa, masauki da sauran ayyuka suna aiki bisa sharuɗɗansu. Duk wata damar mayar da kuɗi tana dogara da sharuɗɗan mai sabis, aikin da aka yi da kuɗin da aka riga aka kashe. Shawarar visa da jinkiri ba su ƙarƙashin BangisKebbi.com." },
    { title: "BK Foundations", body: "Shafukan Gidauniyar ba sa sarrafa gudummawa. Idan aka samar da tsarin tallafi a gaba, za a nuna sharuɗɗansa kafin wata mu’amala." },
    { title: "Neman a duba", body: "Tuntuɓe mu da sunanka, yarjejeniya ko lambar da ta dace da dalilin buƙatarka. Za mu tabbatar da karɓa, mu bincika sannan mu bayyana sakamako. Wannan manufar ba ta rage haƙƙin da doka ba ta yarda a cire ba." },
  ]},
};
