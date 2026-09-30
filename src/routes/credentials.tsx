import { createFileRoute } from "@tanstack/react-router";

import { CompanyCredentials } from "@/components/company-credentials";
import { RouteError } from "@/components/route-error";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/credentials")({
  head: ({ match }) =>
    pageHead({
      search: match.search,
      title: "Credentials — BANGISKEBBI GLOBAL LTD Certificates & Awards",
      description: "View official company certificates, licences and awards published by BANGISKEBBI GLOBAL LTD, including the CAC registration (RC 9884960).",
      path: "/credentials",
    }),
  errorComponent: RouteError,
  component: CredentialsPage,
});

function CredentialsPage() {
  return (
    <main>
      <CompanyCredentials />
    </main>
  );
}
