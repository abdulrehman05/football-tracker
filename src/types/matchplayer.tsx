export interface MatchPlayer {
  playerId: string;

  minutesPlayed?: number;
  goals?: number;
  assists?: number;
  shots?: number;
  shotsOnTarget?: number;

  playerRating?: number;
  position?: string;

  customStats?: CustomStatEntry[];
}
export interface CustomStatEntry {
  statId: string;
  value: number | string;
}

export const numberStats: (
  | "minutesPlayed"
  | "goals"
  | "assists"
  | "shots"
  | "shotsOnTarget"
  | "playerRating"
)[] = [
  "minutesPlayed",
  "goals",
  "assists",
  "shots",
  "shotsOnTarget",
  "playerRating",
];

export const stringStats: "position"[] = ["position"];
export const allStats = [...numberStats, ...stringStats];
export function toTitle(text: string) {
  return text
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}
