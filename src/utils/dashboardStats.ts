import type { AggregatedPlayer } from "./dashboard";
import { avgRating, consistency, winPct } from "./dashboard";

export interface DashboardStat {
  key: string;
  title: string;
  value: (p: AggregatedPlayer) => number;
  additionalVal?: (p: AggregatedPlayer) => string | number;
  sort: "asc" | "desc";
  unit?: string;
}

/**
 * Hardcoded / derived stats
 */
export const dashboardStats: DashboardStat[] = [
  {
    key: "goals",
    title: "Top Goal Scorers",
    value: (p) => p.totals.goals || 0,
    sort: "desc",
  },
  {
    key: "assists",
    title: "Most Assists",
    value: (p) => p.totals.assists || 0,
    sort: "desc",
  },
  {
    key: "avgRating",
    title: "Best Average Rating",
    value: avgRating,
    sort: "desc",
  },
  {
    key: "matches",
    title: "Most Matches Played",
    value: (p) => p.matches,
    sort: "desc",
  },
  {
    key: "winPct",
    title: "Best Win %",
    value: winPct,
    additionalVal: (p) => ` (${p.wins}/${p.matches})`,
    sort: "desc",
    unit: "%",
  },
  {
    key: "lossPct",
    title: "Worst Loss %",
    value: (p) =>
      p.matches && p.matches > 3 ? (p.losses / p.matches) * 100 : 0,
    additionalVal: (p) => ` (${p.losses}/${p.matches})`,
    sort: "desc",
    unit: "%",
  },
  {
    key: "drawPct",
    title: "Draw %",
    value: (p) =>
      p.matches && p.matches > 3 ? (p.draws / p.matches) * 100 : 0,
    additionalVal: (p) => ` (${p.draws}/${p.matches})`,
    sort: "desc",
    unit: "%",
  },
  {
    key: "shots",
    title: "Most Shots",
    value: (p) => p.totals.shots || 0,
    sort: "desc",
  },
  {
    key: "shotsOnTarget",
    title: "Shots on Target",
    value: (p) => p.totals.shotsOnTarget || 0,
    sort: "desc",
  },
  {
    key: "consistency",
    title: "Most Consistent",
    value: consistency,
    additionalVal: (p) => ` (avg: ${avgRating(p).toFixed(3)})`,
    sort: "desc",
  },
  {
    key: "goalConversion",
    title: "Best Goal Conversion",
    value: (p) =>
      p.totals.shots && p.totals.shots >= p.totals.goals
        ? (p.totals.goals / p.totals.shots) * 100
        : 0,

    additionalVal: (p) => ` (${p.totals.goals} / ${p.totals.shots})`,
    sort: "desc",
    unit: "%",
  },
  {
    key: "onTargetPercent",
    title: "Target Shot Percentage",
    value: (p) =>
      p.totals.shots ? (p.totals.shotsOnTarget / p.totals.shots) * 100 : 0,
    additionalVal: (p) => ` (${p.totals.shotsOnTarget} / ${p.totals.shots})`,
    sort: "desc",
    unit: "%",
  },
  {
    key: "involvement",
    title: "Goal Involvement / Match",
    value: (p) =>
      p.matches ? (p.totals.goals + p.totals.assists) / p.matches : 0,
    sort: "desc",
  },
  {
    key: "leaguePoints",
    title: "Total League Points",
    value: (p) => p.wins * 3 + p.draws * 1,
    additionalVal: (p) => ` (${p.wins}W - ${p.draws}D - ${p.losses}L)`,
    sort: "desc",
    unit: "pts",
  },
  {
    key: "ppg",
    title: "Points Per Game (PPG)",
    value: (p) => (p.matches ? (p.wins * 3 + p.draws * 1) / p.matches : 0),
    additionalVal: (p) => ` (${p.wins * 3 + p.draws * 1} pts)`,
    sort: "desc",
  },
];
import type { CustomStat } from "../types/CustomStat";

export function customStatToDashboardStat(cs: CustomStat) {
  return {
    key: cs.id,
    title: cs.name,
    value: (p: any) => p.customTotals[cs.id] || 0,
    additionalVal: () => {
      return "";
    },
    sort: "desc" as const,
    unit: cs.unit,
  };
}
