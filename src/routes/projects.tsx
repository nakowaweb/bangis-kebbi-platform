import { createFileRoute } from "@tanstack/react-router";

import { ProjectsSection } from "@/components/platform-sections";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/projects")({
  head: () =>
    pageHead({
      title: "Selected Work — Bangis Kebbi Projects",
      description:
        "Selected Bangis Kebbi web design, web development, UI/UX, business website and AI-assisted development projects.",
      path: "/projects",
    }),
  component: ProjectsPage,
});

function ProjectsPage() {
  return (
    <main>
      <ProjectsSection full />
    </main>
  );
}
