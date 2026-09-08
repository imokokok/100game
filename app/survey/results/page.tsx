import type { Metadata } from "next";
import { LeadDashboard } from "../../lead/lead-dashboard";

export const metadata: Metadata = {
  title: "NPC 调查问卷结果 / NPC Survey Results",
  robots: { index: false, follow: false },
};

export default function SurveyResultsPage() {
  return <LeadDashboard accessMode="survey-results" />;
}
