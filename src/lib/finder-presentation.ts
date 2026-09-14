import {
  formatDateRange,
  formatMoney,
  type FinderRecommendation,
  type FinderResponse,
} from "./customer-data.ts";

export type FinderCriteriaSummaryItem = {
  id: "dates" | "passengers" | "budget" | "category";
  label: string;
  value: string;
};

export function finderCriteriaSummary(
  criteria: FinderResponse["criteria"],
): FinderCriteriaSummaryItem[] {
  const budget = Number(criteria.maximumBudget);
  const summary: FinderCriteriaSummaryItem[] = [
    {
      id: "dates",
      label: "Rental dates",
      value: formatDateRange(criteria.requestedStart, criteria.requestedEnd),
    },
    {
      id: "passengers",
      label: "Passengers",
      value: Number.isFinite(criteria.passengerCount)
        ? String(criteria.passengerCount)
        : "Not recorded",
    },
    {
      id: "budget",
      label: "Maximum budget",
      value: Number.isFinite(budget)
        ? `${formatMoney(budget)} total`
        : "Budget not recorded",
    },
  ];

  if (criteria.preferredCategory) {
    summary.push({
      id: "category",
      label: "Vehicle preference",
      value: criteria.preferredCategory,
    });
  }

  return summary;
}

export function filterFinderRecommendations(
  recommendations: FinderRecommendation[],
  category: string,
) {
  if (!category) return recommendations;
  return recommendations.filter(
    (recommendation) => recommendation.category === category,
  );
}
