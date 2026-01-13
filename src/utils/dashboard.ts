import dayjs from "dayjs";
import type { Match } from "../types/match";
import type { CustomStat } from "../types/CustomStat";
import { numberStats } from "../types/matchplayer";

export type RangeKey =
  | "thisMonth"
  | "previousMonth"
  | "past6Months"
  | "semester3"
  | "semester4"
  | "semester5"
  | "semester6"
  | "semester7"
  | "semester8"
  | "allTime";

export function resolveDateRange(key: RangeKey) {
  const now = dayjs();

  switch (key) {
    case "thisMonth":
      return [now.startOf("month"), now.endOf("month")];

    case "previousMonth":
      return [
        now.subtract(1, "month").startOf("month"),
        now.subtract(1, "month").endOf("month"),
      ];

    case "past6Months":
      return [now.subtract(6, "month"), now];

    case "semester3":
      return [dayjs("2025-01-12"), dayjs("2025-06-20")];

    // TODO: fill later
    // semester4...
    default:
      return [null, null];
  }
}

export interface AggregatedPlayer {
  playerId: string;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  totals: Record<string, number>;
  customTotals: Record<string, number>;
  ratings: number[];
}

export function aggregateMatches(matches: Match[], customStats: CustomStat[]) {
  const map: Record<string, AggregatedPlayer> = {};

  for (const match of matches) {
    for (const team of match.teams) {
      const isWin =
        (team.id === "A" && match.score.teamA > match.score.teamB) ||
        (team.id === "B" && match.score.teamB > match.score.teamA);

      const isDraw = match.score.teamA === match.score.teamB;

      for (const p of team?.players || []) {
        if (!map[p.playerId]) {
          map[p.playerId] = {
            playerId: p.playerId,
            matches: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            totals: {},
            customTotals: {},
            ratings: [],
          };
        }

        const agg = map[p.playerId];
        agg.matches++;
        if (isDraw) agg.draws++;
        else if (isWin) agg.wins++;
        else agg.losses++;

        for (const stat of numberStats) {
          agg.totals[stat] = (agg.totals[stat] || 0) + (p[stat] ?? 0);
        }

        if (p.playerRating != null) agg.ratings.push(p.playerRating);

        for (const cs of p.customStats ?? []) {
          agg.customTotals[cs.statId] =
            (agg.customTotals[cs.statId] || 0) + (cs.value as any);
        }
      }
    }
  }

  return map;
}

export const avgRating = (p: AggregatedPlayer) =>
  p.ratings.length
    ? p.ratings.reduce((a, b) => a + b, 0) / p.ratings.length
    : 0;

export const winPct = (p: AggregatedPlayer) =>
  p.matches ? (p.wins / p.matches) * 100 : 0;

export const consistency = (p: AggregatedPlayer) => {
  if (p.ratings.length < 2) return 0;
  const avg = avgRating(p);
  return Math.sqrt(
    p.ratings.reduce((s, r) => s + (r - avg) ** 2, 0) / p.ratings.length
  );
};

// export function rankPlayers<T>(
//   players: T[],
//   value: (p: T) => number,
//   dir: "asc" | "desc"
// ) {
//   return [...players].sort((a, b) =>
//     dir === "desc" ? value(b) - value(a) : value(a) - value(b)
//   );
// }
export function rankPlayers<T>(
  players: T[],
  value: (p: T) => number,
  dir: "asc" | "desc",
  dontRemoveZeros: boolean = false // Defaults to true to keep existing behavior
) {
  return players
    .filter((p) => {
      if (dontRemoveZeros) return true;
      return value(p) !== 0;
    })
    .sort((a, b) =>
      dir === "desc" ? value(b) - value(a) : value(a) - value(b)
    );
}
export function applyCompetitionRanking<T>(
  sortedItems: T[],
  valueFn: (item: T) => number
): (T & { rank: number })[] {
  let lastValue: number | null = null;
  let lastRank = 1;

  return sortedItems.map((item, index) => {
    const currentValue = valueFn(item);

    // If the value is different from the previous one,
    // the rank becomes the current 1-based index (index + 1)
    if (lastValue !== null && currentValue !== lastValue) {
      lastRank = index + 1;
    }

    lastValue = currentValue;

    return {
      ...item,
      rank: lastRank,
    };
  });
}
