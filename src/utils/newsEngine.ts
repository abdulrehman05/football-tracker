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
// keep legacy exports (we export below after defining helpers)

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

  // Additional pruning: for headlines that declare a `uniqueId` and `statValue`,
  // keep at most two entries per player per uniqueId (highest statValue wins).
  const perPlayerUnique = new Map<string, NewsHeadline[]>();
  for (const h of final) {
    if (!h.uniqueId) continue;
    const involved = h.playerId ? [h.playerId] : h.relatedPlayerIds || [];
    for (const pid of involved) {
      const key = `${pid}::${h.uniqueId}`;
      const arr = perPlayerUnique.get(key) || [];
      arr.push(h);
      perPlayerUnique.set(key, arr);
    }
  }

  const allowedIds = new Set<string>();
  for (const arr of perPlayerUnique.values()) {
    arr.sort((a, b) => {
      const va = a.statValue ?? a.importance ?? 0;
      const vb = b.statValue ?? b.importance ?? 0;
      return vb - va;
    });
    for (let i = 0; i < Math.min(2, arr.length); i++) allowedIds.add(arr[i].id);
  }

  const filtered = final.filter((h) => {
    if (h.uniqueId) {
      // keep only if allowed by the per-player-unique rule
      return allowedIds.has(h.id);
    }
    return true;
  });

  // Sort by importance desc
  return filtered.sort((a, b) => (b.importance || 0) - (a.importance || 0));
}

export function generatePlayerNews(
  player: Player,
  matches: Match[],
  customStats: CustomStat[],
): NewsHeadline[] {
  const headlines: NewsHeadline[] = [];
  for (const r of playerRules) {
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

// Synchronous optimized generator: precomputes per-player match lists and
// runs player/duo/group rules using those precomputed slices to avoid
// repeatedly scanning the full match list. This is synchronous by design
// to match existing consumer expectations (no webworker here).
export function generateAllHeadlines(
  players: Player[],
  matches: Match[],
  customStats: CustomStat[],
): NewsHeadline[] {
  const headlines: NewsHeadline[] = [];

  // Build match lookup and per-match player lists
  const matchById = new Map<string, Match>();
  const matchPlayers = new Map<string, string[]>(); // matchId -> playerIds
  for (const m of matches) {
    if (!m.id) continue;
    matchById.set(m.id, m);
    const ids: string[] = [];
    for (const t of m.teams || []) {
      for (const pl of t.players || []) ids.push(pl.playerId);
    }
    matchPlayers.set(m.id, ids);
  }

  // Per-player match id arrays (sorted by date)
  const playerMatchIds = new Map<string, string[]>();
  for (const p of players) {
    const arr: string[] = [];
    for (const [mid, ids] of matchPlayers.entries())
      if (ids.includes(p.id)) arr.push(mid);
    arr.sort((a, b) => {
      const ma = matchById.get(a)!;
      const mb = matchById.get(b)!;
      const da = (ma.date as any)?.toDate
        ? (ma.date as any).toDate().getTime()
        : new Date((ma as any).date).getTime();
      const db = (mb.date as any)?.toDate
        ? (mb.date as any).toDate().getTime()
        : new Date((mb as any).date).getTime();
      return da - db;
    });
    playerMatchIds.set(p.id, arr);
  }

  const idsToMatches = (ids: string[]) =>
    ids.map((id) => matchById.get(id)!).filter(Boolean);

  // 1) Player rules using precomputed per-player match arrays
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const pMatches = idsToMatches(playerMatchIds.get(p.id) || []);
    for (const r of playerRules) {
      try {
        const res = r(p, pMatches, customStats) || [];
        for (const h of res) headlines.push(h);
      } catch {
        /* ignore */
      }
    }
  }

  // 2) Duo rules: operate on union of the two players' match ids
  const playerCount = players.length;
  for (let i = 0; i < playerCount; i++) {
    for (let j = i + 1; j < playerCount; j++) {
      const a = players[i];
      const b = players[j];
      const idsA = playerMatchIds.get(a.id) || [];
      const idsB = playerMatchIds.get(b.id) || [];
      if (idsA.length === 0 && idsB.length === 0) continue;
      const union = Array.from(new Set([...idsA, ...idsB]));
      if (union.length === 0) continue;
      const duoMatches = idsToMatches(union);
      for (const r of duoRules) {
        try {
          const res = r(a, b, duoMatches, customStats) || [];
          for (const h of res) headlines.push(h);
        } catch {
          /* ignore */
        }
      }
    }
  }

  // 3) Group rules (triples/quads): only consider groups with non-empty intersection
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

  const triples = players.length >= 3 ? combos(players, 3) : [];
  for (const t of triples) {
    const ids = t.map((pl) => pl.id);
    const lists = ids.map((id) => new Set(playerMatchIds.get(id) || []));
    const inter = lists.reduce(
      (acc, s) => new Set([...acc].filter((x) => s.has(x))),
      lists[0] || new Set(),
    );
    if (inter.size === 0) continue;
    const tMatches = idsToMatches(Array.from(inter));
    for (const r of groupRules) {
      try {
        const res = r(t, tMatches, customStats) || [];
        for (const h of res) headlines.push(h);
      } catch {
        /* ignore */
      }
    }
  }

  const quads = players.length >= 4 ? combos(players, 4) : [];
  for (const q of quads) {
    const ids = q.map((pl) => pl.id);
    const lists = ids.map((id) => new Set(playerMatchIds.get(id) || []));
    const inter = lists.reduce(
      (acc, s) => new Set([...acc].filter((x) => s.has(x))),
      lists[0] || new Set(),
    );
    if (inter.size === 0) continue;
    const qMatches = idsToMatches(Array.from(inter));
    for (const r of groupRules) {
      try {
        const res = r(q, qMatches, customStats) || [];
        for (const h of res) headlines.push(h);
      } catch {
        /* ignore */
      }
    }
  }

  return dedupeHeadlines(headlines);
}
