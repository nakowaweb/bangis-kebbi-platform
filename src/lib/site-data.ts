import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  Code2,
  Compass,
  FileCheck2,
  Globe2,
  HandHeart,
  LayoutDashboard,
  Lightbulb,
  Megaphone,
  MonitorSmartphone,
  Network,
  Palette,
  Plane,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Wrench,
} from "lucide-react";

export const navItems = [
  { labelKey: "home", label: "Home", href: "/", hash: undefined },
  { labelKey: "about", label: "About", href: "/about", hash: undefined },
  { labelKey: "credentials", label: "Credentials", href: "/credentials", hash: undefined },
  { labelKey: "services", label: "Services", href: "/services", hash: undefined },
  { labelKey: "projects", label: "Projects", href: "/projects", hash: undefined },
  { labelKey: "business", label: "Business", href: "/business", hash: undefined },
  { labelKey: "umrah", label: "Umrah", href: "/umrah", hash: undefined },
  { labelKey: "verifiedPartners", label: "Verified Partners", href: "/partners", hash: undefined },
  { labelKey: "foundation", label: "Community Support", href: "/foundation", hash: undefined },
  { labelKey: "blog", label: "Blog", href: "/blog", hash: undefined },
  { labelKey: "contact", label: "Contact", href: "/contact", hash: undefined },
] as const;

export const serviceCards: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: "AI Web Design",
    description: "Modern responsive websites and web applications.",
    icon: Sparkles,
  },
  {
    title: "Web Development",
    description: "Custom websites and database-driven applications.",
    icon: Code2,
  },
  {
    title: "UI/UX Design",
    description: "User-focused digital experiences.",
    icon: Palette,
  },
  {
    title: "WordPress Development",
    description: "Professional business and personal websites.",
    icon: MonitorSmartphone,
  },
  {
    title: "Digital Business Solutions",
    description: "Technology solutions for businesses and organizations.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Website Maintenance",
    description: "Ongoing improvement, updates, and technical support.",
    icon: Wrench,
  },
];

export const businessCategories = [
  { title: "Digital Services", icon: MonitorSmartphone },
  { title: "Business Networking", icon: Network },
  { title: "Technology", icon: Code2 },
  { title: "Community", icon: UsersRound },
  { title: "Global Opportunities", icon: Globe2 },
];

export const umrahProcess = [
  "Register",
  "Become a member",
  "Express interest in Umrah",
  "Complete application",
  "Submit required documents",
  "Application review",
  "Payment request when applicable",
  "Processing",
  "Updates",
  "Final travel arrangements",
];

export const umrahStatuses = [
  "Draft",
  "Submitted",
  "Under Review",
  "Documents Required",
  "Approved",
  "Payment Pending",
  "Payment Received",
  "Processing",
  "Completed",
  "Cancelled",
  "Refund Requested",
  "Refunded",
];

export const foundationInitiatives = [
  {
    title: "Community Support",
    description: "Approved help for people in difficult circumstances and basic needs.",
    status: "Open for planning",
  },
  {
    title: "Learning & Digital Access",
    description: "Support for practical knowledge sharing and access to digital opportunity.",
    status: "Future initiative",
  },
  {
    title: "Emergency Assistance",
    description: "Structured community response when urgent support is appropriate.",
    status: "Review required",
  },
];

export const projectCategories = [
  "Web Design",
  "Web Development",
  "UI/UX",
  "Web Applications",
  "Business Websites",
  "AI-Assisted Development",
];

export const projects = [
  {
    slug: "bangiskebbi-com",
    name: "BangisKebbi.com",
    category: "Personal Brand Platform",
    description: "A premium international digital platform for ideas, technology, business and people.",
  },
  {
    slug: "hospitality-resort-concept",
    name: "Hospitality Resort Concept",
    category: "UI/UX Design",
    description: "A future luxury hospitality website concept.",
  },
  {
    slug: "business-website",
    name: "Business Website",
    category: "Web Development",
    description: "A modern business website concept prepared for a verified project.",
  },
];

export const blogPosts = [
  {
    title: "Turning ideas into real opportunities",
    category: "Digital Opportunities",
    excerpt: "A practical view of how technology and people work together to create meaningful impact.",
  },
  {
    title: "AI-assisted web design for growing brands",
    category: "AI",
    excerpt: "How modern tools can support faster, cleaner and more useful digital products.",
  },
  {
    title: "Building trustworthy online business presence",
    category: "Business",
    excerpt: "Simple principles for professional visibility, community and legitimate opportunities.",
  },
];

export const dashboardPreview = [
  { label: "Profile completion", value: "Ready for setup", icon: BadgeCheck },
  { label: "Verification status", value: "Future member flow", icon: ShieldCheck },
  { label: "Applications", value: "No active application", icon: FileCheck2 },
  { label: "Contributions", value: "Private history", icon: HandHeart },
];

export const quickStats = [
  { label: "Projects", value: "Digital solutions", icon: LayoutDashboard },
  { label: "Vision", value: "Global platform", icon: Globe2 },
  { label: "Community", value: "People first", icon: UsersRound },
  { label: "Purpose", value: "Real impact", icon: Lightbulb },
];

export const philosophyCards = [
  { title: "Ideas", description: "Practical thinking shaped into useful digital platforms.", icon: Lightbulb },
  { title: "Technology", description: "Modern tools used with clarity, care and purpose.", icon: Code2 },
  { title: "Business", description: "Legitimate services, networks and growth opportunities.", icon: CircleDollarSign },
  { title: "People", description: "Community support, learning and meaningful connection.", icon: UsersRound },
];

export const aboutFacts = [
  "Creative digital solutions with a clear purpose",
  "Reliable support for brands and communities",
  "A global mindset grounded in real people",
  "Positive impact through technology and connection",
];

export const aboutAreas = [
  "AI-assisted web design",
  "Web development",
  "UI/UX",
  "Digital business",
  "Business promotion",
  "Community building",
  "Digital solutions",
];

export const contactLinks = [
  { label: "Email Me", icon: BookOpen },
  { label: "WhatsApp", icon: Compass },
  { label: "LinkedIn", icon: Building2 },
  { label: "GitHub", icon: Code2 },
];
