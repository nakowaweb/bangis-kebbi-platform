import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/legal-page";
import { pageHead } from "@/lib/seo";
import { getPublicEntry } from "@/lib/content.functions";
import { useLanguage } from "@/lib/language";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/refund-policy")({
  head: ({ match }) =>
    pageHead({ search: match.search,
      title: "Refund Policy — BangisKebbi.com",
      description: "Refund policy for separately agreed professional services and eligible third-party service arrangements.",
      path: "/refund-policy",
    }),
  component: RefundPage,
});

function RefundPage() {
  const { language } = useLanguage();
  const load = useServerFn(getPublicEntry);
  const managed = useQuery({ queryKey: ["legal", "refund-policy", language], queryFn: () => load({ data: { contentType: "footer", slug: "refund-policy", language } }), staleTime: 1_800_000 });
  return <LegalPage copy={copy} managed={managed.data} />;
}

const copy = {
  en: { eyebrow: "Policy", title: "Refund Policy", description: "How refund requests are handled for Umrah support balances and for digital/web services.", updated: "Effective: 2026", sections: [
    { title: "Umrah support: unused balance", body: "A member may request a refund of an unused available Umrah support balance. The balance is support planning toward the member's own Umrah goal; it is not a return-generating product and involves no profit, interest or promised gain." },
    { title: "Umrah support: full refund where nothing is committed", body: "If funds have not already been committed to non-refundable third-party services or bookings, the unused amount should be refundable in full after review." },
    { title: "Umrah support: third-party costs", body: "Where a non-refundable third-party cost (for example a confirmed booking or provider fee) has already been incurred, only the remaining refundable amount can be returned. The member will be shown which costs were committed." },
    { title: "How to request an Umrah refund", body: "Submit the request through the member dashboard support channel or the Contact page, including your name and application reference. The request is reviewed and the member receives a clear status update at each stage, including the final outcome." },
    { title: "Digital and web services", body: "Refunds for website design, development, maintenance and related services follow the written service or project agreement and the work already completed. Any non-refundable third-party costs (such as domains, hosting, licences or plugins) are disclosed before payment." },
    { title: "BK Community Support Initiative", body: "The public initiative pages do not process contributions. If a support arrangement is introduced, its specific terms will be presented before any transaction." },
    { title: "Your rights", body: "This policy explains our process in plain terms. It does not limit any rights that cannot lawfully be excluded, and it does not create guarantees beyond what is written here." },
  ]},
  ar: { eyebrow: "السياسة", title: "سياسة الاسترداد", description: "كيفية التعامل مع طلبات استرداد رصيد دعم العمرة والخدمات الرقمية وخدمات المواقع.", updated: "سارية من: 2026", sections: [
    { title: "دعم العمرة: الرصيد غير المستخدم", body: "يمكن للعضو طلب استرداد رصيد دعم العمرة المتاح وغير المستخدم. هذا الرصيد تخطيط دعم لهدف العضو في أداء العمرة، وليس منتجاً يحقق عائداً ولا يتضمن ربحاً أو فائدة أو مكسباً موعوداً." },
    { title: "دعم العمرة: استرداد كامل عند عدم الالتزام", body: "إذا لم تُلتزم الأموال لخدمات أو حجوزات غير قابلة للاسترداد لدى أطراف أخرى، فينبغي رد المبلغ غير المستخدم كاملاً بعد المراجعة." },
    { title: "دعم العمرة: تكاليف الأطراف الأخرى", body: "إذا تم تحمل تكلفة غير قابلة للاسترداد لدى طرف آخر، فلا يمكن رد إلا المبلغ المتبقي القابل للاسترداد، مع توضيح التكاليف الملتزم بها للعضو." },
    { title: "طريقة طلب استرداد العمرة", body: "قدّم الطلب عبر قناة الدعم في لوحة العضو أو صفحة التواصل مع اسمك ورقم الطلب. تتم مراجعة الطلب ويتلقى العضو تحديثاً واضحاً للحالة في كل مرحلة بما فيها النتيجة النهائية." },
    { title: "الخدمات الرقمية وخدمات المواقع", body: "يتبع الاسترداد لخدمات التصميم والتطوير والصيانة الاتفاق المكتوب للخدمة أو المشروع والعمل المنجز. ويتم الإفصاح عن أي تكاليف غير قابلة للاسترداد لأطراف أخرى قبل الدفع." },
    { title: "مبادرة BK لدعم المجتمع", body: "لا تعالج صفحات المبادرة العامة أي مساهمات. وإذا أضيف ترتيب دعم فستظهر شروطه قبل أي معاملة." },
    { title: "حقوقك", body: "توضح هذه السياسة إجراءاتنا بلغة واضحة، ولا تحد من الحقوق التي لا يجوز استبعادها قانوناً، ولا تنشئ ضمانات تتجاوز ما هو مكتوب هنا." },
  ]},
  ha: { eyebrow: "Manufa", title: "Manufar Mayar da Kuɗi", description: "Yadda ake sarrafa buƙatar mayar da kuɗin tallafin Umrah da na ayyukan dijital/yanar gizo.", updated: "Ta fara aiki: 2026", sections: [
    { title: "Tallafin Umrah: ragowar da ba a yi amfani da shi ba", body: "Mamba na iya neman a mayar masa da ragowar kuɗin tallafin Umrah da ba a yi amfani da shi ba. Wannan tsarin tallafi ne ga burin mamba na yin Umrah; ba samfurin samun riba ba ne kuma babu riba, ruwa ko alƙawarin ƙari." },
    { title: "Tallafin Umrah: cikakken mayarwa idan ba a kashe ba", body: "Idan ba a riga an sanya kuɗin a cikin sabis ko booking na wasu da ba a mayarwa ba, ya kamata a mayar da cikakken adadin bayan an duba." },
    { title: "Tallafin Umrah: kuɗin wasu", body: "Idan an riga an biya kuɗin wani sabis da ba a mayarwa ba, ragowar da za a iya mayarwa kawai za a dawo, kuma za a nuna wa mamba kuɗin da aka kashe." },
    { title: "Yadda ake neman mayar da kuɗin Umrah", body: "Aika buƙata ta hanyar tallafi a dashboard na mamba ko shafin Tuntuɓa, tare da sunanka da lambar aikace-aikace. Za a duba buƙatar kuma mamba zai sami bayanin matsayi a kowane mataki har zuwa sakamako." },
    { title: "Ayyukan dijital da yanar gizo", body: "Mayar da kuɗin ƙira, haɓakawa, kulawa da sauran ayyuka yana bin rubutacciyar yarjejeniyar aiki da aikin da aka riga aka yi. Za a bayyana duk kuɗin wasu da ba a mayarwa kafin biya." },
    { title: "BK Community Support Initiative", body: "Shafukan shirin ba sa sarrafa gudummawa. Idan aka samar da tsarin tallafi, za a nuna sharuɗɗansa kafin wata mu'amala." },
    { title: "Haƙƙoƙinka", body: "Wannan manufa tana bayyana tsarinmu a sauƙaƙe. Ba ta rage haƙƙin da doka ba ta yarda a cire ba, kuma ba ta ba da tabbaci fiye da abin da aka rubuta." },
  ]},
};
