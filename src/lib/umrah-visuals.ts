import journeyCreateAccountAsset from "@/assets/umrah/journey-create-account.webp";
import journeyCompleteProfileAsset from "@/assets/umrah/journey-complete-profile.webp";
import journeySubmitDocumentsAsset from "@/assets/umrah/journey-submit-documents.webp";
import journeyTrackProgressAsset from "@/assets/umrah/journey-track-progress.webp";
import journeyReviewDashboardAsset from "@/assets/umrah/journey-review-dashboard.webp";
import journeyPrepareDocumentsAsset from "@/assets/umrah/journey-prepare-documents.webp";
import journeyCoordinateTravelAsset from "@/assets/umrah/journey-coordinate-travel.webp";
import journeyReceiveUpdatesAsset from "@/assets/umrah/journey-receive-updates.webp";
import infoDocumentsPrivacyAsset from "@/assets/umrah/info-documents-privacy.webp";
import infoReviewDecisionsAsset from "@/assets/umrah/info-review-decisions.webp";
import infoPreparationAsset from "@/assets/umrah/info-preparation.webp";
import infoCoordinationAsset from "@/assets/umrah/info-coordination.webp";
import infoUpdatesAsset from "@/assets/umrah/info-updates.webp";
import infoCancellationsRefundsAsset from "@/assets/umrah/info-cancellations-refunds.webp";
import supportBalanceAsset from "@/assets/umrah/umrah-support-balance.webp";

export const umrahJourneyVisuals = [
  { slug: "create-account", image: journeyCreateAccountAsset, alt: "Create a member account illustration" },
  { slug: "complete-profile", image: journeyCompleteProfileAsset, alt: "Complete a member profile illustration" },
  { slug: "submit-information-documents", image: journeySubmitDocumentsAsset, alt: "Secure document submission illustration" },
  { slug: "track-support-progress", image: journeyTrackProgressAsset, alt: "Umrah support progress illustration" },
  { slug: "review-dashboard-progress", image: journeyReviewDashboardAsset, alt: "Member dashboard progress illustration" },
  { slug: "prepare-travel-documents", image: journeyPrepareDocumentsAsset, alt: "Travel document preparation illustration" },
  { slug: "coordinate-travel-arrangements", image: journeyCoordinateTravelAsset, alt: "Independent travel coordination illustration" },
  { slug: "receive-updates-support", image: journeyReceiveUpdatesAsset, alt: "Platform updates and support illustration" },
] as const;

export const umrahInformationVisuals = [
  { slug: "documents-privacy", image: infoDocumentsPrivacyAsset, alt: "Private passport and identity documents illustration" },
  { slug: "review-decisions", image: infoReviewDecisionsAsset, alt: "Application review illustration" },
  { slug: "preparation", image: infoPreparationAsset, alt: "Travel preparation illustration" },
  { slug: "coordination", image: infoCoordinationAsset, alt: "Service provider coordination illustration" },
  { slug: "updates", image: infoUpdatesAsset, alt: "Private dashboard updates illustration" },
  { slug: "cancellations-refunds", image: infoCancellationsRefundsAsset, alt: "Cancellation and refund review illustration" },
] as const;

export const umrahBalanceVisual = {
  slug: "support-balance",
  image: supportBalanceAsset,
  alt: "The Kaaba and surrounding mosque as an Umrah support visual",
} as const;