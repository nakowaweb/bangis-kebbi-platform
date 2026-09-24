import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Linkedin, Mail, MessageCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getPublicContent } from "@/lib/content.functions";
import { listPublicSocialLinks } from "@/lib/social.functions";
import { useLanguage } from "@/lib/language";

/** Configured public contact destinations (settings + enabled social links). */
export function useContactLinks() {
  const { language } = useLanguage();
  const load = useServerFn(getPublicContent);
  const loadSocial = useServerFn(listPublicSocialLinks);
  const query = useQuery({ queryKey: ["public-contact-settings", language], queryFn: () => load({ data: { language } }), staleTime: 1000 * 60 * 30 });
  const social = useQuery({ queryKey: ["public-social-links"], queryFn: () => loadSocial(), staleTime: 1000 * 60 * 30 });
  const settings = query.data?.settings;
  const socialWhatsapp = social.data?.find((row) => row.platform === "whatsapp")?.url ?? null;
  return {
    settings,
    email: settings?.contact_email ? `mailto:${settings.contact_email}` : null,
    phone: phoneHref(settings?.phone),
    whatsapp: whatsappHref(settings?.whatsapp) ?? socialWhatsapp,
    linkedin: social.data?.find((row) => row.platform === "linkedin")?.url ?? null,
  };
}

function phoneHref(value: string | null | undefined) {
  return value ? `tel:${value.replace(/[^+\d]/g, "")}` : null;
}

function whatsappHref(value: string | null | undefined) {
  if (!value) return null;
  if (/^https:\/\//i.test(value)) return value;
  const digits = value.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

export function ContactActions({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();
  const { settings, email, phone, whatsapp, linkedin } = useContactLinks();

  return (
    <div className={`flex flex-wrap gap-3 ${compact ? "" : "mt-7"}`}>
      <Button asChild><Link to="/contact">{t("common.contactMe")}</Link></Button>
      {linkedin ? <Button variant="outline" asChild><a href={linkedin} target="_blank" rel="noopener noreferrer"><Linkedin /> LinkedIn</a></Button> : null}
      {whatsapp ? <Button variant="outline" asChild><a href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle /> {t("common.whatsapp")}</a></Button> : null}
      {email ? <Button variant="outline" asChild><a href={email}><Mail /> {t("common.email")}</a></Button> : null}
      {phone ? <Button variant="outline" asChild><a href={phone}><Phone /> {settings?.phone}</a></Button> : null}
    </div>
  );
}