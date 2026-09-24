import { useQuery } from "@tanstack/react-query";
import { ExternalLink, FileBadge2, Search } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { listPublicCredentials, type PublicCredential } from "@/lib/credentials.functions";

const CAC_SEARCH_URL = "https://search.cac.gov.ng/home";
const launchCredential: PublicCredential = {
  id: "launch-company-registration",
  title: "Company Certificate",
  organization: "Corporate Affairs Commission (CAC), Nigeria",
  number: "9884960",
  documentType: "Company registration",
  issueDate: "",
  expiryDate: "",
  description: "Official registration information for BANGISKEBBI GLOBAL LIMITED.",
  verificationUrl: CAC_SEARCH_URL,
  documentUrl: null,
  documentMime: "",
};

export function CompanyCredentials() {
  const load = useServerFn(listPublicCredentials);
  const query = useQuery({ queryKey: ["public-company-credentials"], queryFn: () => load(), staleTime: 1000 * 60 * 15 });
  const credentials = query.data?.length ? query.data : [launchCredential];

  return (
    <section className="section-reveal border-b border-border bg-secondary py-12 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase text-primary">Company Credentials</p>
        <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Official company registration and professional credentials.</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {credentials.map((credential) => <CredentialCard key={credential.id} credential={credential} />)}
        </div>
        <p className="mt-5 text-xs leading-5 text-muted-foreground">The official CAC public search remains the independent route for checking company registration information.</p>
      </div>
    </section>
  );
}

function CredentialCard({ credential }: { credential: PublicCredential }) {
  const image = credential.documentMime.startsWith("image/");
  return (
    <article className="motion-card flex h-full flex-col rounded-lg border border-border bg-card p-5 shadow-sm">
      <span className="grid h-11 w-11 place-items-center rounded-md bg-brand-cyan/10 text-primary"><FileBadge2 className="h-5 w-5" /></span>
      <h3 className="mt-4 font-display text-lg font-bold">{credential.title}</h3>
      <dl className="mt-4 grid gap-2 text-sm">
        <div><dt className="text-xs font-bold uppercase text-muted-foreground">Company</dt><dd className="mt-0.5 font-semibold">BANGISKEBBI GLOBAL LIMITED</dd></div>
        {credential.number ? <div><dt className="text-xs font-bold uppercase text-muted-foreground">RC / Certificate number</dt><dd className="mt-0.5">{credential.number}</dd></div> : null}
        <div><dt className="text-xs font-bold uppercase text-muted-foreground">Document type</dt><dd className="mt-0.5">{credential.documentType}</dd></div>
        <div><dt className="text-xs font-bold uppercase text-muted-foreground">Issuing organization</dt><dd className="mt-0.5">{credential.organization}</dd></div>
        {credential.issueDate ? <div><dt className="text-xs font-bold uppercase text-muted-foreground">Issue date</dt><dd className="mt-0.5">{credential.issueDate}</dd></div> : null}
        {credential.expiryDate ? <div><dt className="text-xs font-bold uppercase text-muted-foreground">Expiry date</dt><dd className="mt-0.5">{credential.expiryDate}</dd></div> : null}
      </dl>
      {credential.description ? <p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground">{credential.description}</p> : <span className="flex-1" />}
      <div className="mt-5 flex flex-wrap gap-2">
        {credential.documentUrl ? (
          <Dialog>
            <DialogTrigger asChild><Button><FileBadge2 /> View Certificate</Button></DialogTrigger>
            <DialogContent className="h-[90vh] max-w-5xl grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
              <DialogHeader><DialogTitle>{credential.title}</DialogTitle><DialogDescription>{credential.organization}</DialogDescription></DialogHeader>
              {image ? <img src={credential.documentUrl} alt={credential.title} className="h-full w-full object-contain" /> : <iframe title={credential.title} src={credential.documentUrl} className="h-full min-h-0 w-full border-0" />}
              <a href={credential.documentUrl} target="_blank" rel="noopener noreferrer" className="absolute right-12 top-4 text-muted-foreground" aria-label="Open certificate in a new tab" title="Open in a new tab"><ExternalLink className="h-4 w-4" /></a>
            </DialogContent>
          </Dialog>
        ) : <Button variant="outline" disabled><FileBadge2 /> Certificate not uploaded</Button>}
        {credential.verificationUrl ? <Button variant="outline" asChild><a href={credential.verificationUrl} target="_blank" rel="noopener noreferrer"><Search /> Verify</a></Button> : null}
      </div>
    </article>
  );
}