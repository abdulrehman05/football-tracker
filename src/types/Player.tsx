import { Timestamp } from "firebase/firestore";

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  birthday?: Timestamp;
  profilePictureUrl?: string;
  bio?: string;
  usualPosition?:
    | "GK"
    | "CB"
    | "LB"
    | "RB"
    | "CDM"
    | "CM"
    | "CAM"
    | "LW"
    | "RW"
    | "ST";
  createdAt: Timestamp;
}
