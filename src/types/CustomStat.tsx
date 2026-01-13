import { Timestamp } from "firebase/firestore";

export interface CustomStat {
  id: string;
  name: string;
  description?: string;
  unit?: string; // "", "%", "times"
  per90?: boolean;
  type: "count" | "ratio" | "boolean";
  createdAt: Timestamp;
}
