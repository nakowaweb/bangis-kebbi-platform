import journeyCreateAccountAsset from "@/assets/umrah/journey-create-account.webp.asset.json";
import journeyCompleteProfileAsset from "@/assets/umrah/journey-complete-profile.webp.asset.json";
import journeySubmitDocumentsAsset from "@/assets/umrah/journey-submit-documents.webp.asset.json";
import journeyTrackProgressAsset from "@/assets/umrah/journey-track-progress.webp.asset.json";
import journeyReviewDashboardAsset from "@/assets/umrah/journey-review-dashboard.webp.asset.json";
import journeyPrepareDocumentsAsset from "@/assets/umrah/journey-prepare-documents.webp.asset.json";
import journeyCoordinateTravelAsset from "@/assets/umrah/journey-coordinate-travel.webp.asset.json";
import journeyReceiveUpdatesAsset from "@/assets/umrah/journey-receive-updates.webp.asset.json";
import infoDocumentsPrivacyAsset from "@/assets/umrah/info-documents-privacy.webp.asset.json";
import infoReviewDecisionsAsset from "@/assets/umrah/info-review-decisions.webp.asset.json";
import infoPreparationAsset from "@/assets/umrah/info-preparation.webp.asset.json";
import infoCoordinationAsset from "@/assets/umrah/info-coordination.webp.asset.json";
import infoUpdatesAsset from "@/assets/umrah/info-updates.webp.asset.json";
import infoCancellationsRefundsAsset from "@/assets/umrah/info-cancellations-refunds.webp.asset.json";
import supportBalanceAsset from "@/assets/umrah/umrah-support-balance.webp.asset.json";

export const umrahJourneyVisuals = [
  { slug: "create-account", image: journeyCreateAccountAsset.url, alt: "Create a member account illustration" },
  { slug: "complete-profile", image: journeyCompleteProfileAsset.url, alt: "Complete a member profile illustration" },
  { slug: "submit-information-documents", image: journeySubmitDocumentsAsset.url, alt: "Secure document submission illustration" },
  { slug: "track-support-progress", image: journeyTrackProgressAsset.url, alt: "Umrah support progress illustration" },
  { slug: "review-dashboard-progress", image: journeyReviewDashboardAsset.url, alt: "Member dashboard progress illustration" },
  { slug: "prepare-travel-documents", image: journeyPrepareDocumentsAsset.url, alt: "Travel document preparation illustration" },
  { slug: "coordinate-travel-arrangements", image: journeyCoordinateTravelAsset.url, alt: "Independent travel coordination illustration" },
  { slug: "receive-updates-support", image: journeyReceiveUpdatesAsset.url, alt: "Platform updates and support illustration" },
] as const;

export const umrahInformationVisuals = [
  { slug: "documents-privacy", image: infoDocumentsPrivacyAsset.url, alt: "Private passport and identity documents illustration" },
  { slug: "review-decisions", image: infoReviewDecisionsAsset.url, alt: "Application review illustration" },
  { slug: "preparation", image: infoPreparationAsset.url, alt: "Travel preparation illustration" },
  { slug: "coordination", image: infoCoordinationAsset.url, alt: "Service provider coordination illustration" },
  { slug: "updates", image: infoUpdatesAsset.url, alt: "Private dashboard updates illustration" },
  { slug: "cancellations-refunds", image: infoCancellationsRefundsAsset.url, alt: "Cancellation and refund review illustration" },
] as const;

export const umrahBalanceVisual = {
  slug: "support-balance",
  image: supportBalanceAsset.url,
  alt: "The Kaaba and surrounding mosque as an Umrah support visual",
} as const;