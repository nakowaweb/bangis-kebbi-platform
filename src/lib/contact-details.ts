export const CONTACT_DETAILS = {
  email: "abubakarbangis01@yahoo.com",
  whatsappNumber: "+968 7529 6334",
  whatsappUrl: "https://wa.me/96875296334",
  linkedin: "https://www.linkedin.com/in/bangiskebbi",
  location: "Kebbi State, Nigeria",
} as const;

export const DEFAULT_SOCIAL_LINKS = [
  { id: "default-linkedin", platform: "linkedin", url: CONTACT_DETAILS.linkedin, display_label: "LinkedIn", icon_key: null, sort_order: 10 },
  { id: "default-whatsapp", platform: "whatsapp", url: CONTACT_DETAILS.whatsappUrl, display_label: "WhatsApp", icon_key: null, sort_order: 20 },
  { id: "default-facebook", platform: "facebook", url: "https://www.facebook.com/bangiskebbi.nakowa", display_label: "Facebook", icon_key: null, sort_order: 30 },
  { id: "default-tiktok", platform: "tiktok", url: "https://www.tiktok.com/@bangis_kebbi_nakowa", display_label: "TikTok", icon_key: null, sort_order: 40 },
  { id: "default-instagram", platform: "instagram", url: "https://www.instagram.com/bangis_kebbi", display_label: "Instagram", icon_key: null, sort_order: 50 },
  { id: "default-youtube", platform: "youtube", url: "https://youtube.com/@bangis_kebbi", display_label: "YouTube", icon_key: null, sort_order: 60 },
] as const;