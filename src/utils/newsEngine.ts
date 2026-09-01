import type { Match } from "../types/match";
import type { Player } from "../types/Player";
import type { CustomStat } from "../types/CustomStat";
import rulesModule, { playerRules, duoRules, NewsHeadline } from "./newsRules";

export type { NewsHeadline };

export function generatePlayerNews(
  player: Player,
  matches: Match[],
  customStats: CustomStat[],
): NewsHeadline[] {
  const headlines: NewsHeadline[] = [];
  for (const r of playerRules) {
    try {
      const res = r(player, matches, customStats) || [];
      for (const h of res) headlines.push(h);
    } catch (err) {
      // rule failed — ignore to keep engine resilient
      // console.warn('player rule error', err);
    }
  }
  return headlines;
}

export function generateIntertwinedNews(
  players: Player[],
  matches: Match[],
  customStats: CustomStat[],
): NewsHeadline[] {
  const headlines: NewsHeadline[] = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i];
      const b = players[j];
      for (const r of duoRules) {
        try {
          const res = r(a, b, matches, customStats) || [];
          for (const h of res) headlines.push(h);
        } catch (err) {
          // ignore
        }
      }
    }
  }
  return headlines;
}

export default { generatePlayerNews, generateIntertwinedNews };
