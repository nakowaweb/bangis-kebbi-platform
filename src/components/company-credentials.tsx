import { useQuery } from "@tanstack/react-query";
import { Download, ExternalLink, FileBadge2, FileText, Search } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";

import cacCredentialDesign from "@/assets/cac-credential-reference.png";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { listPublicCredentials, type PublicCredential } from "@/lib/credentials.functions";

const CAC_SEARCH_URL = "https://search.cac.gov.ng/home";
const launchCredential: PublicCredential = {
  id: "launch-company-registration",
  title: "CAC Certificate of Incorporation",
  companyName: "BANGISKEBBI GLOBAL LTD",
  organization: "Corporate Affairs Commission (CAC), Nigeria",
  number: "9884960",
  documentType: "Certificate",
  issueDate: "2026-09-24",
  expiryDate: "",
  description: "Private Company Limited by Shares. Incorporated 24 September 2026.",
  verificationUrl: CAC_SEARCH_URL,
  documentUrl: null,
  documentMime: "",
  allowDownload: false,
};

export function CompanyCredentials() {
  const load = useServerFn(listPublicCredentials);
  const query = useQuery({ queryKey: ["public-company-credentials"], queryFn: () => load(), staleTime: 1000 * 60 * 15 });
  const credentials = query.data?.length ? query.data : [launchCredential];

  return (
    <section id="company-credentials" className="section-reveal scroll-mt-24 border-b border-border bg-secondary py-12 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase text-primary">Credentials</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Company certificates, licences and awards.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Official documents published by BANGISKEBBI GLOBAL LTD. Open any card to preview the document.</p>
        {query.isSuccess && !query.data?.length ? <p className="mt-6 rounded-lg border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">No additional certificates, licences or awards have been published yet. The CAC registration below remains available.</p> : null}
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {credentials.map((credential) => <CredentialCard key={credential.id} credential={credential} />)}
        </div>
        <p className="mt-5 text-xs leading-5 text-muted-foreground">The official CAC public search remains the independent route for checking company registration information.</p>
      </div>
    </section>
  );
}

function CredentialCard({ credential }: { credential: PublicCredential }) {
  const isLaunchCacCredential = credential.number === "9884960" && credential.companyName === "BANGISKEBBI GLOBAL LTD";
  const image = credential.documentMime.startsWith("image/");
  const certificateViewer = (
    <DialogContent className="h-[90vh] max-w-5xl grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
      <DialogHeader><DialogTitle>{credential.title}</DialogTitle><DialogDescription>{credential.organization}</DialogDescription></DialogHeader>
      {credential.documentUrl ? (image ? <img src={credential.documentUrl} alt={credential.title} className="h-full w-full object-contain" /> : <iframe title={credential.title} src={credential.documentUrl} className="h-full min-h-0 w-full border-0" />) : <div className="grid h-full place-items-center rounded-md border border-dashed border-border bg-secondary p-8 text-center"><div><FileBadge2 className="mx-auto h-10 w-10 text-primary" /><p className="mt-4 font-semibold">The official certificate document has not been uploaded yet.</p><p className="mt-2 text-sm text-muted-foreground">Use the independent CAC public search to check the registration information.</p></div></div>}
      {credential.documentUrl && credential.allowDownload ? <a href={credential.documentUrl} download className="absolute right-20 top-4 text-muted-foreground" aria-label="Download document" title="Download"><Download className="h-4 w-4" /></a> : null}
      {credential.documentUrl ? <a href={credential.documentUrl} target="_blank" rel="noopener noreferrer" className="absolute right-12 top-4 text-muted-foreground" aria-label="Open certificate in a new tab" title="Open in a new tab"><ExternalLink className="h-4 w-4" /></a> : null}
    </DialogContent>
  );

  if (isLaunchCacCredential) {
    return (
      <article className="motion-card relative overflow-hidden rounded-lg border border-border bg-card shadow-sm md:col-span-2 lg:col-span-3" aria-label={`${credential.title}, ${credential.companyName}, RC Number ${credential.number}`}>
        <div className="relative aspect-[1433/521] w-full overflow-hidden">
          <img
            src={cacCredentialDesign}
            alt="CAC Certificate of Incorporation for BANGISKEBBI GLOBAL LTD, RC Number 9884960"
            className="pointer-events-none absolute left-[-3.63%] top-[-46.25%] h-[196.55%] w-[107.19%] max-w-none object-cover"
            loading="eager"
            decoding="async"
          />
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="absolute left-[3.35%] top-[71.4%] h-[20.3%] w-[35.1%] bg-transparent p-0 text-transparent shadow-none hover:bg-transparent hover:text-transparent focus-visible:ring-2 focus-visible:ring-ring" aria-label="View Certificate">
                <span className="sr-only">View Certificate</span>
              </Button>
            </DialogTrigger>
            {certificateViewer}
          </Dialog>
          {credential.verificationUrl ? <Button variant="ghost" className="absolute left-[40.1%] top-[71.4%] h-[20.3%] w-[18.4%] bg-transparent p-0 text-transparent shadow-none hover:bg-transparent hover:text-transparent focus-visible:ring-2 focus-visible:ring-ring" asChild><a href={credential.verificationUrl} target="_blank" rel="noopener noreferrer" aria-label="Verify on the official CAC company search"><span className="sr-only">Verify</span></a></Button> : null}
        </div>
      </article>
    );
  }

  return (
    <article className="motion-card flex h-full flex-col rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="-mx-5 -mt-5 mb-1 grid aspect-[4/3] place-items-center overflow-hidden rounded-t-lg bg-secondary">{credential.documentUrl && image ? <img src={credential.documentUrl} alt="" loading="lazy" className="size-full object-cover" /> : credential.documentUrl ? <span className="grid justify-items-center gap-2 text-primary"><FileText className="h-10 w-10" /><span className="text-xs font-bold uppercase">PDF</span></span> : <FileBadge2 className="h-10 w-10 text-primary" />}</div>
      {credential.documentType ? <p className="mt-3 text-xs font-bold uppercase text-primary">{credential.documentType}</p> : null}
      <h3 className="mt-1 font-display text-lg font-bold">{credential.title}</h3>
      <dl className="mt-4 grid gap-2 text-sm">
        <div><dt className="text-xs font-bold uppercase text-muted-foreground">Company Name</dt><dd className="mt-0.5 font-semibold">{credential.companyName || "BANGISKEBBI GLOBAL LTD"}</dd></div>
        {credential.number ? <div><dt className="text-xs font-bold uppercase text-muted-foreground">RC Number</dt><dd className="mt-0.5">{credential.number}</dd></div> : null}
      </dl>
      <span className="flex-1" />
      <div className="mt-5 flex flex-wrap gap-2">
        <Dialog>
            <DialogTrigger asChild><Button disabled={!credential.documentUrl}><FileBadge2 /> View Document</Button></DialogTrigger>
            {certificateViewer}
          </Dialog>
        {credential.documentUrl && credential.allowDownload ? <Button variant="outline" asChild><a href={credential.documentUrl} download><Download /> Download</a></Button> : null}
        {credential.verificationUrl ? <Button variant="outline" asChild><a href={credential.verificationUrl} target="_blank" rel="noopener noreferrer"><Search /> Verify</a></Button> : null}
      </div>
    </article>
  );
}