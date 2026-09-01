import type { Match } from "../types/match";
import type { Player } from "../types/Player";
import type { CustomStat } from "../types/CustomStat";
import {
  playerRules,
  duoRules,
  groupRules,
  type NewsHeadline,
} from "./newsRules";

// NOTE: We intentionally do NOT filter matches globally by recency here.
// Rules themselves must decide whether a headline is "active" (for example,
// a losing streak rule should verify the streak is currently ongoing and
// disappear once the player scores/wins). This gives rule-level control as
// requested by the user.

function normalizeText(t: string) {
  return t.replace(/\s+/g, " ").trim().toLowerCase();
}

// Keep only the most important headline per unique normalized text
function dedupeHeadlines(headlines: NewsHeadline[]) {
  const byText = new Map<string, NewsHeadline>();

  for (const h of headlines) {
    const key = `${h.type}:${h.playerId || ""}:${(h.relatedPlayerIds || []).slice().sort().join(",")}::${normalizeText(h.text)}`;
    const existing = byText.get(key);
    if (!existing || (h.importance || 0) > (existing.importance || 0)) {
      byText.set(key, h);
    }
  }

  // Also reduce per-player/category noise: keep only top headline per (player, category)
  const final: NewsHeadline[] = [];
  const topPerPlayerCategory = new Map<string, NewsHeadline>();
  for (const h of byText.values()) {
    if (h.playerId) {
      const pcKey = `${h.playerId}::${h.category}`;
      const cur = topPerPlayerCategory.get(pcKey);
      if (!cur || (h.importance || 0) > (cur.importance || 0)) {
        topPerPlayerCategory.set(pcKey, h);
      }
    } else {
      final.push(h);
    }
  }
  for (const v of topPerPlayerCategory.values()) final.push(v);

  // Sort by importance desc
  return final.sort((a, b) => (b.importance || 0) - (a.importance || 0));
}

export function generatePlayerNews(
  player: Player,
  matches: Match[],
  customStats: CustomStat[],
): NewsHeadline[] {
  // Rules are given the full match history and are responsible for deciding
  // whether a headline is still "active" (for example, streaks must be
  // verified as ongoing by the rule itself).
  const headlines: NewsHeadline[] = [];
  for (const r of playerRules) {
    try {
      // Provide rules with matches sorted by date (oldest -> newest) so
      // continuity checks (streaks, current activity) work reliably.
      const sorted = matches.slice().sort((a, b) => {
        const da = (a.date as any)?.toDate
          ? (a.date as any).toDate().getTime()
          : new Date((a as any).date).getTime();
        const db = (b.date as any)?.toDate
          ? (b.date as any).toDate().getTime()
          : new Date((b as any).date).getTime();
        return da - db;
      });
      const res = r(player, sorted, customStats) || [];
      for (const h of res) headlines.push(h);
    } catch (err) {
      // resilient: ignore rule errors
    }
  }
  return dedupeHeadlines(headlines);
}

export function generateIntertwinedNews(
  players: Player[],
  matches: Match[],
  customStats: CustomStat[],
): NewsHeadline[] {
  // See note above: pass full matches so group/duo rules can evaluate activity
  // semantics themselves.
  const headlines: NewsHeadline[] = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i];
      const b = players[j];
      for (const r of duoRules) {
        try {
          const sorted = matches.slice().sort((a, b) => {
            const da = (a.date as any)?.toDate
              ? (a.date as any).toDate().getTime()
              : new Date((a as any).date).getTime();
            const db = (b.date as any)?.toDate
              ? (b.date as any).toDate().getTime()
              : new Date((b as any).date).getTime();
            return da - db;
          });
          const res = r(a, b, sorted, customStats) || [];
          for (const h of res) headlines.push(h);
        } catch (err) {
          // ignore
        }
      }
    }
  }

  // Run group rules (triples and quads)
  function combos<T>(arr: T[], k: number): T[][] {
    const out: T[][] = [];
    const n = arr.length;
    const pick: number[] = [];
    function backtrack(start: number) {
      if (pick.length === k) {
        out.push(pick.map((i) => arr[i]));
        return;
      }
      for (let i = start; i < n; i++) {
        pick.push(i);
        backtrack(i + 1);
        pick.pop();
      }
    }
    backtrack(0);
    return out;
  }

  if (players.length >= 3) {
    const triples = combos(players, 3);
    for (const t of triples) {
      for (const r of groupRules) {
        try {
          const sorted = matches.slice().sort((a, b) => {
            const da = (a.date as any)?.toDate
              ? (a.date as any).toDate().getTime()
              : new Date((a as any).date).getTime();
            const db = (b.date as any)?.toDate
              ? (b.date as any).toDate().getTime()
              : new Date((b as any).date).getTime();
            return da - db;
          });
          const res = r(t, sorted, customStats) || [];
          for (const h of res) headlines.push(h);
        } catch (err) {
          /* ignore group rule error */
        }
      }
    }
  }

  if (players.length >= 4) {
    const quads = combos(players, 4);
    for (const q of quads) {
      for (const r of groupRules) {
        try {
          const sorted = matches.slice().sort((a, b) => {
            const da = (a.date as any)?.toDate
              ? (a.date as any).toDate().getTime()
              : new Date((a as any).date).getTime();
            const db = (b.date as any)?.toDate
              ? (b.date as any).toDate().getTime()
              : new Date((b as any).date).getTime();
            return da - db;
          });
          const res = r(q, sorted, customStats) || [];
          for (const h of res) headlines.push(h);
        } catch (err) {
          /* ignore group rule error */
        }
      }
    }
  }
  return dedupeHeadlines(headlines);
}

export default { generatePlayerNews, generateIntertwinedNews };
