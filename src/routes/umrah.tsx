import { Link, createFileRoute } from "@tanstack/react-router";
import type { LanguageCode } from "@/lib/i18n/dictionary";

import { ContactSection, UmrahSection } from "@/components/platform-sections";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicUmrahInfo } from "@/lib/umrah.functions";
import { pageHead } from "@/lib/seo";
import { useLanguage } from "@/lib/language";
import { ContactActions } from "@/components/contact-actions";

export const Route = createFileRoute("/umrah")({
  head: ({ match }: { match: { search: { lang?: LanguageCode } } }) =>
    pageHead({ search: match.search,
      title: "Umrah Support Program — Bangis Kebbi",
      description:
        "Bangis Kebbi Umrah Support Program explains an organized member application, document and status tracking process.",
      path: "/umrah",
    }),
  loaderDeps: (opts) => ({ lang: ((opts.search as { lang?: LanguageCode }).lang ?? "en") as LanguageCode }),
  loader: ({ deps }) => getPublicUmrahInfo({ data: { language: deps.lang } }),
  errorComponent: () => (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-bold">Umrah information is unavailable right now</h1>
      <p className="mt-3 text-sm text-muted-foreground">Please try again in a moment.</p>
    </main>
  ),
  notFoundComponent: () => (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-bold">Page not found</h1>
    </main>
  ),
  component: UmrahPage,
});

type Entry = { id: string; content_type: string; title: string; summary: string | null; body: string | null };

function UmrahPage() {
  const { entries, partners } = Route.useLoaderData();
  const { language } = useLanguage();
  const rows = entries as Entry[];
  const group = (type: string) => rows.filter((entry) => entry.content_type === type);

  const steps = group("umrah_step");
  const requirements = group("umrah_requirement");
  const faqs = group("umrah_faq");
  const notices = group("umrah_notice");
  const info = [...group("umrah"), ...group("umrah_information")];
  const contact = group("umrah_contact");
  const fallback = umrahCopy[language];

  return (
    <main>
      <UmrahSection />

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10">
           <section><h1 className="font-display text-3xl font-bold">{fallback.title}</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">{fallback.intro}</p></section>
           {info.length > 0 ? <Block title={fallback.information} items={info} /> : null}
           <Journey title={fallback.journey} steps={fallback.steps} />
           {steps.length > 0 ? <Block title={fallback.publishedSteps} items={steps} ordered /> : null}
           <div className="grid gap-4 md:grid-cols-2"><InfoPanel title={fallback.documentsTitle} body={fallback.documents} /><InfoPanel title={fallback.reviewTitle} body={fallback.review} /><InfoPanel title={fallback.preparationTitle} body={fallback.preparation} /><InfoPanel title={fallback.coordinationTitle} body={fallback.coordination} /><InfoPanel title={fallback.updatesTitle} body={fallback.updates} /><InfoPanel title={fallback.refundTitle} body={fallback.refund} /></div>
           {requirements.length > 0 ? <Block title={fallback.requirements} items={requirements} /> : null}
           {notices.length > 0 ? <Block title={fallback.notices} items={notices} /> : null}
           {faqs.length > 0 ? <Block title={fallback.questions} items={faqs} /> : null}
           {contact.length > 0 ? <Block title={fallback.contact} items={contact} /> : null}

          {partners.length > 0 ? (
            <div>
              <h2 className="font-display text-xl font-bold sm:text-2xl">Verified partners</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {partners.map((partner: { id: string; name: string; country: string | null; website_url: string | null; services: string | null }) => (
                  <Card key={partner.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{partner.name}</CardTitle>
                      <CardDescription>{partner.country ?? ""}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                      {partner.services ? <p className="text-sm text-muted-foreground">{partner.services}</p> : null}
                      {partner.website_url ? (
                        <a className="text-sm font-medium text-brand-cyan underline" href={partner.website_url} target="_blank" rel="noopener noreferrer">
                          Visit website
                        </a>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}

          <Card className="border-brand-cyan/40">
            <CardHeader>
               <CardTitle className="text-lg">{fallback.applyTitle}</CardTitle>
              <CardDescription>
                 {fallback.applyBody}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild>
                 <Link to="/login">{fallback.signIn}</Link>
              </Button>
              <Button asChild variant="outline">
                 <Link to="/register">{fallback.register}</Link>
              </Button>
            </CardContent>
          </Card>
           <ContactActions />
        </div>
      </section>

      <ContactSection />
    </main>
  );
}

function Journey({ title, steps }: { title: string; steps: string[] }) {
  return <section><h2 className="font-display text-2xl font-bold">{title}</h2><ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{steps.map((step, index) => <li key={step} className="rounded-lg border border-border bg-card p-5"><span className="text-xs font-bold text-primary">{String(index + 1).padStart(2, "0")}</span><p className="mt-2 text-sm font-semibold leading-6">{step}</p></li>)}</ol></section>;
}

function InfoPanel({ title, body }: { title: string; body: string }) {
  return <section className="rounded-lg border border-border bg-card p-5"><h2 className="font-display text-lg font-bold">{title}</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p></section>;
}

const umrahCopy = {
  en: { title: "Umrah Support Program", intro: "A clear support process for members who want help organizing an Umrah enquiry and application. BangisKebbi.com provides coordination and updates; it is not a visa authority, embassy, airline or licensed travel provider, and no approval or travel outcome is guaranteed.", information: "Program information", journey: "The support journey", publishedSteps: "Published program steps", steps: ["Explore the public program information", "Create or sign in to a member account", "Start and complete the private application", "Upload Passport, ID Card Front and ID Card Back", "Authorized staff review the submitted details", "Receive requests or status updates in the dashboard", "Prepare with an independent verified service provider", "Receive coordination updates for any confirmed arrangement"], documentsTitle: "Documents and privacy", documents: "The application accepts exactly three document slots: Passport, ID Card Front and ID Card Back. Documents remain private and are reviewed only by the member and authorized staff.", reviewTitle: "Review and decisions", review: "Submitting an application does not mean acceptance. Information may be checked and corrections may be requested. Visa decisions and provider approvals remain with the relevant independent authorities.", preparationTitle: "Preparation", preparation: "Members should verify passport validity, health guidance, travel requirements and all provider terms before making commitments.", coordinationTitle: "Coordination", coordination: "Any travel, accommodation, transport or visa service is handled by independent providers under confirmed written arrangements. Availability and timing can change.", updatesTitle: "Updates", updates: "Application status and administrative messages appear in the private member dashboard. Important changes should be confirmed before relying on them.", refundTitle: "Cancellations and refunds", refund: "The website does not collect Umrah payments. Where a third-party arrangement exists, cancellation and refund eligibility follow that provider’s written terms and costs already committed.", requirements: "Requirements", notices: "Important notices", questions: "Questions and answers", contact: "Contact", applyTitle: "Apply as a member", applyBody: "Applications are private. Sign in to start an application, upload the three requested documents securely and follow its status.", signIn: "Sign in to apply", register: "Create a member account" },
  ar: { title: "برنامج دعم العمرة", intro: "مسار دعم واضح للأعضاء الراغبين في المساعدة على تنظيم استفسار وطلب العمرة. يقدم BangisKebbi.com التنسيق والتحديثات، وليس جهة تأشيرات أو سفارة أو شركة طيران أو مزود سفر مرخصاً، ولا يضمن القبول أو نتيجة السفر.", information: "معلومات البرنامج", journey: "رحلة الدعم", publishedSteps: "خطوات البرنامج المنشورة", steps: ["استكشاف معلومات البرنامج العامة", "إنشاء حساب عضو أو تسجيل الدخول", "بدء الطلب الخاص وإكماله", "رفع جواز السفر ووجهي بطاقة الهوية", "مراجعة التفاصيل من موظفين مخولين", "استلام الطلبات أو تحديثات الحالة في اللوحة", "الاستعداد مع مزود خدمة مستقل موثوق", "استلام تحديثات التنسيق لأي ترتيب مؤكد"], documentsTitle: "الوثائق والخصوصية", documents: "يقبل الطلب ثلاثة مواضع فقط: جواز السفر، وجه بطاقة الهوية، وظهر بطاقة الهوية. تبقى الوثائق خاصة ولا يراجعها إلا العضو والموظفون المخولون.", reviewTitle: "المراجعة والقرارات", review: "تقديم الطلب لا يعني القبول. قد يتم التحقق من المعلومات وطلب التصحيح. وتبقى قرارات التأشيرة وموافقات المزودين لدى الجهات المستقلة ذات الصلة.", preparationTitle: "الاستعداد", preparation: "على الأعضاء التحقق من صلاحية الجواز والإرشادات الصحية ومتطلبات السفر وشروط المزود قبل أي التزام.", coordinationTitle: "التنسيق", coordination: "يتولى مزودون مستقلون خدمات السفر والإقامة والنقل والتأشيرة وفق ترتيبات مكتوبة مؤكدة. وقد يتغير التوفر والتوقيت.", updatesTitle: "التحديثات", updates: "تظهر حالة الطلب والرسائل الإدارية في لوحة العضو الخاصة. يجب تأكيد التغييرات المهمة قبل الاعتماد عليها.", refundTitle: "الإلغاء والاسترداد", refund: "لا يجمع الموقع مدفوعات العمرة. وإذا وُجد ترتيب مع طرف آخر، فتخضع أهلية الإلغاء والاسترداد لشروطه المكتوبة والتكاليف التي التزم بها.", requirements: "المتطلبات", notices: "تنبيهات مهمة", questions: "الأسئلة والأجوبة", contact: "التواصل", applyTitle: "قدّم كعضو", applyBody: "الطلبات خاصة. سجّل الدخول لبدء الطلب ورفع الوثائق الثلاثة المطلوبة بأمان ومتابعة الحالة.", signIn: "تسجيل الدخول للتقديم", register: "إنشاء حساب عضو" },
  ha: { title: "Shirin Tallafin Umrah", intro: "Tsarin tallafi mai bayyani ga mambobin da ke son taimako wajen tsara tambaya da aikace-aikacen Umrah. BangisKebbi.com yana taimakawa da tsari da sabuntawa; ba hukumar visa, ofishin jakadanci, kamfanin jirgi ko mai ba da tafiya da lasisi ba ne, kuma ba a bada tabbacin amincewa ko tafiya.", information: "Bayanin shirin", journey: "Tafiyar tallafi", publishedSteps: "Matakan shirin da aka wallafa", steps: ["Duba bayanin shirin na jama’a", "Ƙirƙiri asusun mamba ko shiga", "Fara ka kammala aikace-aikace na sirri", "Tura Passport, gaban ID Card da bayan ID Card", "Ma’aikatan da aka ba izini su duba bayanan", "Karɓi buƙata ko sabunta matsayi a dashboard", "Yi shiri da mai ba da sabis mai zaman kansa", "Karɓi sabunta tsari ga duk yarjejeniyar da aka tabbatar"], documentsTitle: "Takardu da sirri", documents: "Aikace-aikacen yana karɓar wurare uku kawai: Passport, ID Card Front da ID Card Back. Takardun suna zaman kansu kuma mamba da ma’aikatan da aka ba izini ne kawai ke dubawa.", reviewTitle: "Dubawa da shawara", review: "Tura aikace-aikace ba yana nufin an amince ba. Za a iya tabbatar da bayanai ko neman gyara. Shawarar visa da amincewar mai sabis suna hannun hukumomin da suka dace.", preparationTitle: "Shiri", preparation: "Mamba ya tabbatar da ingancin passport, shawarwarin lafiya, bukatun tafiya da sharuɗɗan mai sabis kafin yin alkawari.", coordinationTitle: "Tsarawa", coordination: "Masu ba da sabis masu zaman kansu ne ke tafiyar da tafiya, masauki, mota ko visa bisa rubutacciyar yarjejeniya. Samuwa da lokaci na iya canzawa.", updatesTitle: "Sabuntawa", updates: "Matsayin aikace-aikace da saƙonnin gudanarwa suna bayyana a dashboard na mamba. A tabbatar da muhimmin sauyi kafin dogaro da shi.", refundTitle: "Sokewa da mayar da kuɗi", refund: "Shafin ba ya karɓar kuɗin Umrah. Idan akwai yarjejeniya da wani, sokewa da mayar da kuɗi za su bi rubutattun sharuɗɗansa da kuɗin da aka riga aka kashe.", requirements: "Buƙatu", notices: "Muhimman sanarwa", questions: "Tambayoyi da amsoshi", contact: "Tuntuɓa", applyTitle: "Nemi a matsayin mamba", applyBody: "Aikace-aikace na sirri ne. Shiga don farawa, tura takardu uku cikin tsaro kuma bi matsayi.", signIn: "Shiga don nema", register: "Ƙirƙiri asusun mamba" },
};

function Block({ title, items, ordered }: { title: string; items: Entry[]; ordered?: boolean }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold sm:text-2xl">{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item, index) => (
          <Card key={item.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {ordered ? <span className="mr-2 text-brand-cyan">{index + 1}.</span> : null}
                {item.title}
              </CardTitle>
              {item.summary ? <CardDescription>{item.summary}</CardDescription> : null}
            </CardHeader>
            {item.body ? (
              <CardContent>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{item.body}</p>
              </CardContent>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
