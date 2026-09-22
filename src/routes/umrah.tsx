import { Link, createFileRoute } from "@tanstack/react-router";

import { ContactSection, UmrahSection } from "@/components/platform-sections";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicUmrahInfo } from "@/lib/umrah.functions";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/umrah")({
  head: ({ match }) =>
    pageHead({ search: match.search,
      title: "Umrah Support Program — Bangis Kebbi",
      description:
        "Bangis Kebbi Umrah Support Program explains an organized member application, document and status tracking process.",
      path: "/umrah",
    }),
  loader: () => getPublicUmrahInfo(),
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
  const rows = entries as Entry[];
  const group = (type: string) => rows.filter((entry) => entry.content_type === type);

  const steps = group("umrah_step");
  const requirements = group("umrah_requirement");
  const faqs = group("umrah_faq");
  const notices = group("umrah_notice");
  const info = [...group("umrah"), ...group("umrah_information")];
  const contact = group("umrah_contact");

  return (
    <main>
      <UmrahSection />

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10">
          {info.length > 0 ? <Block title="Umrah information" items={info} /> : null}
          {steps.length > 0 ? <Block title="How it works" items={steps} ordered /> : null}
          {requirements.length > 0 ? <Block title="Requirements" items={requirements} /> : null}
          {notices.length > 0 ? <Block title="Important notices" items={notices} /> : null}
          {faqs.length > 0 ? <Block title="Questions & answers" items={faqs} /> : null}
          {contact.length > 0 ? <Block title="Contact" items={contact} /> : null}

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
              <CardTitle className="text-lg">Apply as a member</CardTitle>
              <CardDescription>
                Applications are private. Sign in to your member account to start an application, upload your documents securely and
                follow the status. No payment is collected at this stage.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/login">Sign in to apply</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/register">Create a member account</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <ContactSection />
    </main>
  );
}

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
