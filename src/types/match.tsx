import type { Timestamp } from "firebase/firestore";
import type { Team } from "./team";

export interface Match {
  id: string;

  date: Timestamp;

  duration?: number; // minutes
  format?: "5v5" | "7v7" | "9v9" | "11v11";
  location?: string;

  score: {
    teamA: number;
    teamB: number;
  };

  teams: Team[];

  createdAt: Timestamp;
}
