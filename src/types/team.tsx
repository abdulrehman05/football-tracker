import type { MatchPlayer } from "./matchplayer";

export interface Team {
  id: string;
  name: string;
  players: MatchPlayer[];
}
