import type { Match } from "../types/match";
import type { Player } from "../types/Player";
import type { CustomStat } from "../types/CustomStat";

// Lightweight headline shape used by the engine
export interface NewsHeadline {
  id: string;
  type: "player" | "duo" | "league";
  playerId?: string;
  relatedPlayerIds?: string[];
  emoji: string;
  category: "Curse" | "Form" | "Shame" | "Glory" | "Silly";
  text: string;
  importance: number;
}

// Helper to safely read nested match player stats
function findPlayerInMatch(match: Match, playerId: string) {
  for (const team of match.teams) {
    const p = team.players?.find((pl) => pl.playerId === playerId);
    if (p) return { teamId: team.id, stats: p };
  }
  return null;
}

// Player-specific rule functions produce 0..N headlines for a given player
export type PlayerRule = (
  player: Player,
  matches: Match[],
  customStats: CustomStat[],
) => NewsHeadline[];

// Duo / pair rules
export type DuoRule = (
  a: Player,
  b: Player,
  matches: Match[],
  customStats: CustomStat[],
) => NewsHeadline[];

// Group rules for 3+ players
export type GroupRule = (
  group: Player[],
  matches: Match[],
  customStats: CustomStat[],
) => NewsHeadline[];
function getCustomStatValue(
  stats: any,
  statNameOrId: string,
  customStats: CustomStat[],
): number {
  if (!stats?.customStats) return 0;
  const matchCs = customStats.find(
    (c) =>
      c.name.toLowerCase() === statNameOrId.toLowerCase() ||
      c.id === statNameOrId,
  );
  if (!matchCs) return 0;
  const entry = stats.customStats.find((c: any) => c.statId === matchCs.id);
  return entry ? Number(entry.value) || 0 : 0;
}

const safe = (v: any) => (v == null ? 0 : Number(v));

// Player rules array — add or edit these rules easily
export const playerRules: PlayerRule[] = [
  // Unbeaten streak
  (player, matches) => {
    const pMatches = matches.filter((m) =>
      m.teams.some((t) => t.players?.some((pl) => pl.playerId === player.id)),
    );
    const outcomes = pMatches.map((m) => {
      const found = findPlayerInMatch(m, player.id)!;
      const myScore = found.teamId === "A" ? m.score.teamA : m.score.teamB;
      const oppScore = found.teamId === "A" ? m.score.teamB : m.score.teamA;
      return { lost: myScore < oppScore };
    });
    let unbeaten = 0;
    for (let i = outcomes.length - 1; i >= 0; i--) {
      if (!outcomes[i].lost) unbeaten++;
      else break;
    }
    if (unbeaten >= 3) {
      return [
        {
          id: `${player.id}_unbeaten_${unbeaten}`,
          type: "player",
          playerId: player.id,
          emoji: "🛡️",
          category: "Form",
          text: `${player.name} is currently on a ${unbeaten}-match unbeaten streak!`,
          importance: 8,
        },
      ];
    }
    return [];
  },

  // Losing streak
  (player, matches) => {
    const pMatches = matches.filter((m) =>
      m.teams.some((t) => t.players?.some((pl) => pl.playerId === player.id)),
    );
    const outcomes = pMatches.map((m) => {
      const found = findPlayerInMatch(m, player.id)!;
      const myScore = found.teamId === "A" ? m.score.teamA : m.score.teamB;
      const oppScore = found.teamId === "A" ? m.score.teamB : m.score.teamA;
      return { lost: myScore < oppScore };
    });
    let losing = 0;
    for (let i = outcomes.length - 1; i >= 0; i--) {
      if (outcomes[i].lost) losing++;
      else break;
    }
    if (losing >= 3) {
      return [
        {
          id: `${player.id}_losing_${losing}`,
          type: "player",
          playerId: player.id,
          emoji: "📉",
          category: "Curse",
          text: `${player.name} has lost ${losing} matches in a row. Needs urgent intervention.`,
          importance: 9,
        },
      ];
    }
    return [];
  },

  // Goal drought (>=4)
  (player, matches) => {
    const pMatches = matches.filter((m) =>
      m.teams.some((t) => t.players?.some((pl) => pl.playerId === player.id)),
    );
    const outcomes = pMatches.map((m) => {
      const found = findPlayerInMatch(m, player.id)!.stats;
      return { goals: safe(found.goals) };
    });
    let noGoalGames = 0;
    for (let i = outcomes.length - 1; i >= 0; i--) {
      if (outcomes[i].goals === 0) noGoalGames++;
      else break;
    }
    if (noGoalGames >= 4) {
      return [
        {
          id: `${player.id}_drought_${noGoalGames}`,
          type: "player",
          playerId: player.id,
          emoji: "🌵",
          category: "Curse",
          text: `${player.name} hasn't found the back of the net in his last ${noGoalGames} matches!`,
          importance: 7,
        },
      ];
    }
    return [];
  },

  // Scoring streak (>=3)
  (player, matches) => {
    const pMatches = matches.filter((m) =>
      m.teams.some((t) => t.players?.some((pl) => pl.playerId === player.id)),
    );
    const outcomes = pMatches.map((m) => ({
      goals: safe(findPlayerInMatch(m, player.id)!.stats.goals),
    }));
    let scoringStreak = 0;
    for (let i = outcomes.length - 1; i >= 0; i--) {
      if (outcomes[i].goals > 0) scoringStreak++;
      else break;
    }
    if (scoringStreak >= 3) {
      return [
        {
          id: `${player.id}_streak_${scoringStreak}`,
          type: "player",
          playerId: player.id,
          emoji: "🔥",
          category: "Form",
          text: `${player.name} is on fire! Has scored in ${scoringStreak} consecutive games.`,
          importance: 8,
        },
      ];
    }
    return [];
  },

  // Zero goals but many shots
  (player, matches) => {
    const pMatches = matches.filter((m) =>
      m.teams.some((t) => t.players?.some((pl) => pl.playerId === player.id)),
    );
    const totals = pMatches.reduce(
      (acc, m) => {
        const s = findPlayerInMatch(m, player.id)!.stats;
        acc.goals += safe(s.goals);
        acc.shots += safe(s.shots);
        return acc;
      },
      { goals: 0, shots: 0 },
    );
    if (totals.goals === 0 && totals.shots >= 15) {
      return [
        {
          id: `${player.id}_stormtrooper`,
          type: "player",
          playerId: player.id,
          emoji: "🎯",
          category: "Shame",
          text: `${player.name} has taken ${totals.shots} shots all-time and still has ZERO goals.`,
          importance: 10,
        },
      ];
    }
    return [];
  },

  // Hat-trick hero (any match)
  (player, matches) => {
    const hits: NewsHeadline[] = [];
    matches.forEach((m) => {
      const f = findPlayerInMatch(m, player.id);
      if (!f) return;
      if (safe(f.stats.goals) >= 3) {
        hits.push({
          id: `${player.id}_hattrick_${m.id}`,
          type: "player",
          playerId: player.id,
          emoji: "🎩",
          category: "Glory",
          text: `${player.name} took home the match ball with a clinical hat-trick (${f.stats.goals} goals)!`,
          importance: 7,
        });
      }
    });
    return hits;
  },

  // High rating despite loss
  (player, matches) => {
    const hits: NewsHeadline[] = [];
    matches.forEach((m) => {
      const f = findPlayerInMatch(m, player.id);
      if (!f) return;
      const myScore = f.teamId === "A" ? m.score.teamA : m.score.teamB;
      const oppScore = f.teamId === "A" ? m.score.teamB : m.score.teamA;
      if (myScore < oppScore && safe(f.stats.playerRating) >= 8.5) {
        hits.push({
          id: `${player.id}_carrying_${m.id}`,
          type: "player",
          playerId: player.id,
          emoji: "🎒",
          category: "Glory",
          text: `${player.name} dropped a masterclass ${f.stats.playerRating} rating, but his team STILL lost!`,
          importance: 7,
        });
      }
    });
    return hits;
  },

  // Perfect shot accuracy (min 4 shots)
  (player, matches) => {
    const hits: NewsHeadline[] = [];
    matches.forEach((m) => {
      const f = findPlayerInMatch(m, player.id);
      if (!f) return;
      if (
        safe(f.stats.shots) >= 4 &&
        safe(f.stats.shotsOnTarget) === safe(f.stats.shots)
      ) {
        hits.push({
          id: `${player.id}_deadeye_${m.id}`,
          type: "player",
          playerId: player.id,
          emoji: "🎯",
          category: "Glory",
          text: `${player.name} was 100% accurate in a match, hitting target on all ${f.stats.shots} shots!`,
          importance: 6,
        });
      }
    });
    return hits;
  },

  // Recent form: last N matches goals low/high (programmatic variations)
  (player, matches) => {
    const results: NewsHeadline[] = [];
    const pMatches = matches
      .filter((m) =>
        m.teams.some((t) => t.players?.some((pl) => pl.playerId === player.id)),
      )
      .sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime());
    const windows = [3, 5, 7, 10];
    windows.forEach((w) => {
      const last = pMatches.slice(-w);
      if (last.length < w) return;
      const goals = last.reduce(
        (s, m) => s + safe(findPlayerInMatch(m, player.id)!.stats.goals),
        0,
      );
      if (goals <= 1) {
        results.push({
          id: `${player.id}_dry_${w}`,
          type: "player",
          playerId: player.id,
          emoji: "🥶",
          category: "Form",
          text: `In the last ${w} matches ${player.name} has played, he has only scored ${goals} time(s).`,
          importance: 7,
        });
      }
      if (goals >= Math.max(3, w)) {
        results.push({
          id: `${player.id}_hot_${w}`,
          type: "player",
          playerId: player.id,
          emoji: "⚡",
          category: "Form",
          text: `${player.name} is hot: ${goals} goals in his last ${w} matches.`,
          importance: 8,
        });
      }
    });
    return results;
  },

  // Custom stat-based rule example: punches
  (player, matches, customStats) => {
    const totalPunches = matches.reduce((acc, m) => {
      const f = findPlayerInMatch(m, player.id);
      if (!f) return acc;
      const entry = (f.stats.customStats || []).find(
        (c: any) =>
          (
            customStats.find((cs) => cs.id === c.statId)?.name || ""
          ).toLowerCase() === "punches" || c.statId === "punches",
      );
      return acc + (entry ? safe(entry.value) : 0);
    }, 0);
    if (totalPunches >= 3) {
      return [
        {
          id: `${player.id}_punches_${totalPunches}`,
          type: "player",
          playerId: player.id,
          emoji: "🥊",
          category: "Silly",
          text: `${player.name} has accumulated ${totalPunches} punches. Bro is playing UFC instead of Football.`,
          importance: 9,
        },
      ];
    }
    return [];
  },

  // Fallback: total goals high
  (player, matches) => {
    const totals = matches.reduce(
      (acc, m) => {
        const f = findPlayerInMatch(m, player.id);
        if (!f) return acc;
        acc.goals += safe(f.stats.goals);
        acc.assists += safe(f.stats.assists);
        return acc;
      },
      { goals: 0, assists: 0 },
    );
    const out: NewsHeadline[] = [];
    if (totals.goals >= 10)
      out.push({
        id: `${player.id}_goals_tot_${totals.goals}`,
        type: "player",
        playerId: player.id,
        emoji: "⚽",
        category: "Glory",
        text: `${player.name} has racked up ${totals.goals} goals — prolific!`,
        importance: 7,
      });
    if (totals.assists >= 8)
      out.push({
        id: `${player.id}_assists_tot_${totals.assists}`,
        type: "player",
        playerId: player.id,
        emoji: "🅰️",
        category: "Glory",
        text: `${player.name} has ${totals.assists} assists — ultimate creator!`,
        importance: 6,
      });
    return out;
  },
  // 1. Playmaker Masterclass (3+ assists in a single game)
  (player, matches) => {
    const hits: NewsHeadline[] = [];
    matches.forEach((m) => {
      const f = findPlayerInMatch(m, player.id);
      if (!f) return;
      if (safe(f.stats.assists) >= 3) {
        hits.push({
          id: `${player.id}_assist_master_${m.id}`,
          type: "player",
          playerId: player.id,
          emoji: "🅰️",
          category: "Glory",
          text: `${player.name} put on a playmaker clinic with ${f.stats.assists} assists in a single match!`,
          importance: 8,
        });
      }
    });
    return hits;
  },

  // 2. Stinker Rating Streak (3+ consecutive matches rating < 5.0)
  (player, matches) => {
    const pMatches = matches
      .filter((m) =>
        m.teams.some((t) => t.players?.some((pl) => pl.playerId === player.id)),
      )
      .sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime());

    let lowRatingStreak = 0;
    for (let i = pMatches.length - 1; i >= 0; i--) {
      const r = safe(
        findPlayerInMatch(pMatches[i], player.id)!.stats.playerRating,
      );
      if (r > 0 && r < 5.0) lowRatingStreak++;
      else break;
    }

    if (lowRatingStreak >= 3) {
      return [
        {
          id: `${player.id}_stinker_streak_${lowRatingStreak}`,
          type: "player",
          playerId: player.id,
          emoji: "📉",
          category: "Shame",
          text: `${player.name} is in a severe slump with ${lowRatingStreak} consecutive sub-5.0 match ratings!`,
          importance: 8,
        },
      ];
    }
    return [];
  },

  // 3. Super Clinical (2+ goals on <= 2 total shots in a match)
  (player, matches) => {
    const hits: NewsHeadline[] = [];
    matches.forEach((m) => {
      const f = findPlayerInMatch(m, player.id);
      if (!f) return;
      const g = safe(f.stats.goals);
      const s = safe(f.stats.shots);
      if (g >= 2 && s > 0 && s <= 2) {
        hits.push({
          id: `${player.id}_super_clinical_${m.id}`,
          type: "player",
          playerId: player.id,
          emoji: "⚡",
          category: "Glory",
          text: `100% efficiency! ${player.name} scored ${g} goals on just ${s} shot(s)!`,
          importance: 7,
        });
      }
    });
    return hits;
  },

  // 4. Brick Wall Keeper (5+ saves in a single game)
  (player, matches, customStats) => {
    const hits: NewsHeadline[] = [];
    matches.forEach((m) => {
      const f = findPlayerInMatch(m, player.id);
      if (!f) return;
      const saves =
        getCustomStatValue(f.stats, "keeper saves", customStats) ||
        getCustomStatValue(f.stats, "saves", customStats);
      if (saves >= 5) {
        hits.push({
          id: `${player.id}_saves_master_${m.id}`,
          type: "player",
          playerId: player.id,
          emoji: "🧱",
          category: "Glory",
          text: `Brick wall! ${player.name} made ${saves} saves in a single game to keep his team alive.`,
          importance: 8,
        });
      }
    });
    return hits;
  },

  // 5. Double-Double Monster (2+ goals AND 2+ assists in same match)
  (player, matches) => {
    const hits: NewsHeadline[] = [];
    matches.forEach((m) => {
      const f = findPlayerInMatch(m, player.id);
      if (!f) return;
      if (safe(f.stats.goals) >= 2 && safe(f.stats.assists) >= 2) {
        hits.push({
          id: `${player.id}_double_double_${m.id}`,
          type: "player",
          playerId: player.id,
          emoji: "👑",
          category: "Glory",
          text: `${player.name} was untouchable: ${f.stats.goals} goals AND ${f.stats.assists} assists in one game!`,
          importance: 9,
        });
      }
    });
    return hits;
  },

  // 6. Penalty Miss Blunder
  (player, matches, customStats) => {
    const hits: NewsHeadline[] = [];
    matches.forEach((m) => {
      const f = findPlayerInMatch(m, player.id);
      if (!f) return;
      const misses = getCustomStatValue(f.stats, "penalty miss", customStats);
      if (misses > 0) {
        hits.push({
          id: `${player.id}_pen_miss_${m.id}`,
          type: "player",
          playerId: player.id,
          emoji: "💔",
          category: "Shame",
          text: `${player.name} choked from 12 yards out with a painful penalty miss!`,
          importance: 7,
        });
      }
    });
    return hits;
  },

  // 7. Versatile Utility Player (Played 3+ different positions across matches)
  (player, matches) => {
    const positions = new Set<string>();
    matches.forEach((m) => {
      const f = findPlayerInMatch(m, player.id);
      if (f?.stats.position) positions.add(f.stats.position);
    });
    if (positions.size >= 3) {
      return [
        {
          id: `${player.id}_utility_${positions.size}`,
          type: "player",
          playerId: player.id,
          emoji: "🔄",
          category: "Silly",
          text: `${player.name} is the team chameleon, having played in ${positions.size} distinct positions!`,
          importance: 5,
        },
      ];
    }
    return [];
  },

  // 8. Ghost Shooter (5+ shots, 0 goals, 0 assists, rating < 6.0 in a single match)
  (player, matches) => {
    const hits: NewsHeadline[] = [];
    matches.forEach((m) => {
      const f = findPlayerInMatch(m, player.id);
      if (!f) return;
      const g = safe(f.stats.goals);
      const a = safe(f.stats.assists);
      const s = safe(f.stats.shots);
      const r = safe(f.stats.playerRating);
      if (s >= 5 && g === 0 && a === 0 && r > 0 && r < 6.0) {
        hits.push({
          id: `${player.id}_ghost_shooter_${m.id}`,
          type: "player",
          playerId: player.id,
          emoji: "💨",
          category: "Shame",
          text: `${player.name} wasted ${s} shots with 0 goals, 0 assists, and a low ${r} rating!`,
          importance: 6,
        });
      }
    });
    return hits;
  },

  // 9. Card / Disciplinary Merchant (Accumulated cards / fouls)
  (player, matches, customStats) => {
    let cards = 0;
    matches.forEach((m) => {
      const f = findPlayerInMatch(m, player.id);
      if (!f) return;
      cards +=
        getCustomStatValue(f.stats, "yellow cards", customStats) +
        getCustomStatValue(f.stats, "red card", customStats);
    });
    if (cards >= 3) {
      return [
        {
          id: `${player.id}_card_merchant_${cards}`,
          type: "player",
          playerId: player.id,
          emoji: "🟨",
          category: "Silly",
          text: `${player.name} has picked up ${cards} cards. The referee has him on speed dial!`,
          importance: 7,
        },
      ];
    }
    return [];
  },

  // 10. Consolation Goal Specialist (Scored multiple times in matches his team lost)
  (player, matches) => {
    let lossGoals = 0;
    matches.forEach((m) => {
      const f = findPlayerInMatch(m, player.id);
      if (!f) return;
      const myScore = f.teamId === "A" ? m.score.teamA : m.score.teamB;
      const oppScore = f.teamId === "A" ? m.score.teamB : m.score.teamA;
      if (myScore < oppScore && safe(f.stats.goals) >= 1) {
        lossGoals += safe(f.stats.goals);
      }
    });
    if (lossGoals >= 4) {
      return [
        {
          id: `${player.id}_consolation_king_${lossGoals}`,
          type: "player",
          playerId: player.id,
          emoji: "😭",
          category: "Silly",
          text: `${player.name} has scored ${lossGoals} goals in losing efforts. Padding stats in defeat?`,
          importance: 6,
        },
      ];
    }
    return [];
  },
];

// Duo rules — checks between two players
export const duoRules: DuoRule[] = [
  // Played together N times and never won
  (a, b, matches) => {
    let playedTogether = 0;
    let togetherWins = 0;
    matches.forEach((m) => {
      const aFound = findPlayerInMatch(m, a.id);
      const bFound = findPlayerInMatch(m, b.id);
      if (!aFound || !bFound) return;
      if (aFound.teamId === bFound.teamId) {
        playedTogether++;
        const teamScore = aFound.teamId === "A" ? m.score.teamA : m.score.teamB;
        const oppScore = aFound.teamId === "A" ? m.score.teamB : m.score.teamA;
        if (teamScore > oppScore) togetherWins++;
      }
    });
    if (playedTogether >= 4 && togetherWins === 0) {
      return [
        {
          id: `curse_together_${a.id}_${b.id}`,
          type: "duo",
          relatedPlayerIds: [a.id, b.id],
          emoji: "☣️",
          category: "Curse",
          text: `${a.name} played with ${b.name} ${playedTogether} times and has NEVER won!`,
          importance: 10,
        },
      ];
    }
    return [];
  },

  // Duo undefeated (>=4 games together)
  (a, b, matches) => {
    let playedTogether = 0;
    let togetherLosses = 0;
    matches.forEach((m) => {
      const aFound = findPlayerInMatch(m, a.id);
      const bFound = findPlayerInMatch(m, b.id);
      if (!aFound || !bFound) return;
      if (aFound.teamId === bFound.teamId) {
        playedTogether++;
        const teamScore = aFound.teamId === "A" ? m.score.teamA : m.score.teamB;
        const oppScore = aFound.teamId === "A" ? m.score.teamB : m.score.teamA;
        if (teamScore < oppScore) togetherLosses++;
      }
    });
    if (playedTogether >= 4 && togetherLosses === 0) {
      return [
        {
          id: `god_duo_${a.id}_${b.id}`,
          type: "duo",
          relatedPlayerIds: [a.id, b.id],
          emoji: "💎",
          category: "Glory",
          text: `${a.name} and ${b.name} are UNDEFEATED when playing together (${playedTogether} matches)!`,
          importance: 9,
        },
      ];
    }
    return [];
  },

  // Never scored when playing against
  (a, b, matches) => {
    let playedAgainst = 0;
    let aGoalsVsB = 0;
    matches.forEach((m) => {
      const aFound = findPlayerInMatch(m, a.id);
      const bFound = findPlayerInMatch(m, b.id);
      if (!aFound || !bFound) return;
      if (aFound.teamId !== bFound.teamId) {
        playedAgainst++;
        aGoalsVsB += safe(aFound.stats.goals);
      }
    });
    if (playedAgainst >= 5 && aGoalsVsB === 0) {
      return [
        {
          id: `pocketed_${a.id}_${b.id}`,
          type: "duo",
          relatedPlayerIds: [a.id, b.id],
          emoji: "🔒",
          category: "Shame",
          text: `${a.name} has played against ${b.name} ${playedAgainst} times and NEVER scored! Fully pocketed.`,
          importance: 9,
        },
      ];
    }
    return [];
  },

  // High scoring rivalry
  (a, b, matches) => {
    let playedAgainst = 0;
    let aGoals = 0;
    let bGoals = 0;
    matches.forEach((m) => {
      const aFound = findPlayerInMatch(m, a.id);
      const bFound = findPlayerInMatch(m, b.id);
      if (!aFound || !bFound) return;
      if (aFound.teamId !== bFound.teamId) {
        playedAgainst++;
        aGoals += safe(aFound.stats.goals);
        bGoals += safe(bFound.stats.goals);
      }
    });
    if (playedAgainst >= 3 && aGoals >= 6 && bGoals >= 6) {
      return [
        {
          id: `el_clasico_${a.id}_${b.id}`,
          type: "duo",
          relatedPlayerIds: [a.id, b.id],
          emoji: "⚔️",
          category: "Glory",
          text: `El Clásico alert! ${a.name} and ${b.name} have scored ${aGoals + bGoals} goals against each other!`,
          importance: 8,
        },
      ];
    }
    return [];
  },

  // Punch incident when losing (duo variant)
  (a, b, matches, customStats) => {
    const hits: NewsHeadline[] = [];
    matches.forEach((m) => {
      const aFound = findPlayerInMatch(m, a.id);
      const bFound = findPlayerInMatch(m, b.id);
      if (!aFound || !bFound) return;
      if (aFound.teamId === bFound.teamId) return; // only opponents
      const aPunches = (aFound.stats.customStats || []).find(
        (c: any) =>
          c.statId === "punches" ||
          (
            customStats.find((cs) => cs.id === c.statId)?.name || ""
          ).toLowerCase() === "punches",
      );
      if (
        aPunches &&
        safe(aPunches.value) > 0 &&
        aFound.teamId &&
        ((aFound.teamId === "A" && m.score.teamA < m.score.teamB) ||
          (aFound.teamId === "B" && m.score.teamB < m.score.teamA))
      ) {
        hits.push({
          id: `punch_${a.id}_${b.id}_${m.id}`,
          type: "duo",
          relatedPlayerIds: [a.id, b.id],
          emoji: "👊",
          category: "Silly",
          text: `${a.name} punched in a match where he lost against ${b.name}'s team!`,
          importance: 10,
        });
      }
    });
    return hits;
  },
  // 1. Telepathic Connection (A assisted B's goals 3+ times)
  (a, b, matches) => {
    let aAssistsToB = 0;
    matches.forEach((m) => {
      const aFound = findPlayerInMatch(m, a.id);
      const bFound = findPlayerInMatch(m, b.id);
      if (!aFound || !bFound || aFound.teamId !== bFound.teamId) return;
      if (safe(aFound.stats.assists) > 0 && safe(bFound.stats.goals) > 0) {
        aAssistsToB++;
      }
    });
    if (aAssistsToB >= 3) {
      return [
        {
          id: `telepathy_${a.id}_${b.id}`,
          type: "duo",
          relatedPlayerIds: [a.id, b.id],
          emoji: "🎯",
          category: "Glory",
          text: `Telepathic duo: ${a.name} has set up ${b.name} for a goal in ${aAssistsToB} different matches!`,
          importance: 8,
        },
      ];
    }
    return [];
  },

  // 2. Rivalry Thrashing (A's team beat B's team by 5+ goals margin)
  (a, b, matches) => {
    const hits: NewsHeadline[] = [];
    matches.forEach((m) => {
      const aFound = findPlayerInMatch(m, a.id);
      const bFound = findPlayerInMatch(m, b.id);
      if (!aFound || !bFound || aFound.teamId === bFound.teamId) return;
      const aScore = aFound.teamId === "A" ? m.score.teamA : m.score.teamB;
      const bScore = bFound.teamId === "A" ? m.score.teamA : m.score.teamB;
      if (aScore - bScore >= 5) {
        hits.push({
          id: `thrashing_${a.id}_${b.id}_${m.id}`,
          type: "duo",
          relatedPlayerIds: [a.id, b.id],
          emoji: "💥",
          category: "Shame",
          text: `Total demolition: ${a.name}'s team crushed ${b.name}'s team ${aScore}-${bScore}!`,
          importance: 9,
        });
      }
    });
    return hits;
  },

  // 3. Double Stinker (A & B played together, lost, and both got ratings < 5.5)
  (a, b, matches) => {
    const hits: NewsHeadline[] = [];
    matches.forEach((m) => {
      const aFound = findPlayerInMatch(m, a.id);
      const bFound = findPlayerInMatch(m, b.id);
      if (!aFound || !bFound || aFound.teamId !== bFound.teamId) return;
      const teamScore = aFound.teamId === "A" ? m.score.teamA : m.score.teamB;
      const oppScore = aFound.teamId === "A" ? m.score.teamB : m.score.teamA;
      const rA = safe(aFound.stats.playerRating);
      const rB = safe(bFound.stats.playerRating);

      if (teamScore < oppScore && rA > 0 && rA < 5.5 && rB > 0 && rB < 5.5) {
        hits.push({
          id: `double_stinker_${a.id}_${b.id}_${m.id}`,
          type: "duo",
          relatedPlayerIds: [a.id, b.id],
          emoji: "🤡",
          category: "Shame",
          text: `Disasterclass duo: ${a.name} (${rA}) and ${b.name} (${rB}) both put up stinkers in a loss!`,
          importance: 8,
        });
      }
    });
    return hits;
  },

  // 4. Symmetric Rivalry (4+ games played against each other, 50% exact win split)
  (a, b, matches) => {
    let playedAgainst = 0;
    let aWins = 0;
    let bWins = 0;
    matches.forEach((m) => {
      const aFound = findPlayerInMatch(m, a.id);
      const bFound = findPlayerInMatch(m, b.id);
      if (!aFound || !bFound || aFound.teamId === bFound.teamId) return;
      playedAgainst++;
      const aScore = aFound.teamId === "A" ? m.score.teamA : m.score.teamB;
      const bScore = bFound.teamId === "A" ? m.score.teamA : m.score.teamB;
      if (aScore > bScore) aWins++;
      if (bScore > aScore) bWins++;
    });

    if (playedAgainst >= 4 && aWins > 0 && aWins === bWins) {
      return [
        {
          id: `deadlock_rivalry_${a.id}_${b.id}`,
          type: "duo",
          relatedPlayerIds: [a.id, b.id],
          emoji: "⚖️",
          category: "Form",
          text: `Perfectly balanced: ${a.name} and ${b.name} are deadlocked at ${aWins}-${bWins} in head-to-head wins!`,
          importance: 7,
        },
      ];
    }
    return [];
  },

  // 5. Goal Monopoly (A & B combined scored 80%+ of team's goals in a win)
  (a, b, matches) => {
    const hits: NewsHeadline[] = [];
    matches.forEach((m) => {
      const aFound = findPlayerInMatch(m, a.id);
      const bFound = findPlayerInMatch(m, b.id);
      if (!aFound || !bFound || aFound.teamId !== bFound.teamId) return;
      const teamScore = aFound.teamId === "A" ? m.score.teamA : m.score.teamB;
      const oppScore = aFound.teamId === "A" ? m.score.teamB : m.score.teamA;
      const duoGoals = safe(aFound.stats.goals) + safe(bFound.stats.goals);

      if (
        teamScore > oppScore &&
        teamScore >= 4 &&
        duoGoals / teamScore >= 0.8
      ) {
        hits.push({
          id: `goal_monopoly_${a.id}_${b.id}_${m.id}`,
          type: "duo",
          relatedPlayerIds: [a.id, b.id],
          emoji: "⚽",
          category: "Glory",
          text: `Two-man show! ${a.name} and ${b.name} scored ${duoGoals} of their team's ${teamScore} total goals!`,
          importance: 8,
        });
      }
    });
    return hits;
  },

  // 6. Defensive Wall Opponent (B's team kept A's team to 0 goals twice)
  (a, b, matches) => {
    let shutouts = 0;
    matches.forEach((m) => {
      const aFound = findPlayerInMatch(m, a.id);
      const bFound = findPlayerInMatch(m, b.id);
      if (!aFound || !bFound || aFound.teamId === bFound.teamId) return;
      const aTeamScore = aFound.teamId === "A" ? m.score.teamA : m.score.teamB;
      if (aTeamScore === 0) shutouts++;
    });

    if (shutouts >= 2) {
      return [
        {
          id: `shutout_wall_${a.id}_${b.id}`,
          type: "duo",
          relatedPlayerIds: [a.id, b.id],
          emoji: "🧱",
          category: "Curse",
          text: `${a.name}'s team has been shut out (0 goals) ${shutouts} times when facing ${b.name}!`,
          importance: 8,
        },
      ];
    }
    return [];
  },

  // 7. High-Octane Matches (A vs B matches average 6+ total goals)
  (a, b, matches) => {
    let playedAgainst = 0;
    let totalGoalsScored = 0;
    matches.forEach((m) => {
      const aFound = findPlayerInMatch(m, a.id);
      const bFound = findPlayerInMatch(m, b.id);
      if (!aFound || !bFound || aFound.teamId === bFound.teamId) return;
      playedAgainst++;
      totalGoalsScored += m.score.teamA + m.score.teamB;
    });

    if (playedAgainst >= 3 && totalGoalsScored / playedAgainst >= 6.0) {
      const avg = (totalGoalsScored / playedAgainst).toFixed(1);
      return [
        {
          id: `goal_fest_${a.id}_${b.id}`,
          type: "duo",
          relatedPlayerIds: [a.id, b.id],
          emoji: "🎆",
          category: "Silly",
          text: `Goal-fest guaranteed! Matches between ${a.name} and ${b.name} average ${avg} total goals!`,
          importance: 7,
        },
      ];
    }
    return [];
  },

  // 8. Role Swap Assist (A assisted B in one game AND B assisted A in another)
  (a, b, matches) => {
    let aAssistedB = false;
    let bAssistedA = false;
    matches.forEach((m) => {
      const aFound = findPlayerInMatch(m, a.id);
      const bFound = findPlayerInMatch(m, b.id);
      if (!aFound || !bFound || aFound.teamId !== bFound.teamId) return;
      if (safe(aFound.stats.assists) > 0 && safe(bFound.stats.goals) > 0)
        aAssistedB = true;
      if (safe(bFound.stats.assists) > 0 && safe(aFound.stats.goals) > 0)
        bAssistedA = true;
    });

    if (aAssistedB && bAssistedA) {
      return [
        {
          id: `mutual_assists_${a.id}_${b.id}`,
          type: "duo",
          relatedPlayerIds: [a.id, b.id],
          emoji: "🤝",
          category: "Glory",
          text: `Mutual chemistry: ${a.name} and ${b.name} have both assisted each other's goals in separate games!`,
          importance: 7,
        },
      ];
    }
    return [];
  },

  // 9. Target Practice Bully (A took 6+ shots against B's team without scoring)
  (a, b, matches) => {
    const hits: NewsHeadline[] = [];
    matches.forEach((m) => {
      const aFound = findPlayerInMatch(m, a.id);
      const bFound = findPlayerInMatch(m, b.id);
      if (!aFound || !bFound || aFound.teamId === bFound.teamId) return;
      const s = safe(aFound.stats.shots);
      const g = safe(aFound.stats.goals);
      if (s >= 6 && g === 0) {
        hits.push({
          id: `target_practice_${a.id}_${b.id}_${m.id}`,
          type: "duo",
          relatedPlayerIds: [a.id, b.id],
          emoji: "🚫",
          category: "Shame",
          text: `${a.name} unleashed ${s} shots against ${b.name}'s defense and STILL couldn't score!`,
          importance: 7,
        });
      }
    });
    return hits;
  },

  // 10. Double Masterclass (A & B played together and both achieved >= 8.5 rating)
  (a, b, matches) => {
    const hits: NewsHeadline[] = [];
    matches.forEach((m) => {
      const aFound = findPlayerInMatch(m, a.id);
      const bFound = findPlayerInMatch(m, b.id);
      if (!aFound || !bFound || aFound.teamId !== bFound.teamId) return;
      const rA = safe(aFound.stats.playerRating);
      const rB = safe(bFound.stats.playerRating);

      if (rA >= 8.5 && rB >= 8.5) {
        hits.push({
          id: `double_masterclass_${a.id}_${b.id}_${m.id}`,
          type: "duo",
          relatedPlayerIds: [a.id, b.id],
          emoji: "⭐",
          category: "Glory",
          text: `Masterclass pair: ${a.name} (${rA}) and ${b.name} (${rB}) put on a performance for the ages!`,
          importance: 9,
        });
      }
    });
    return hits;
  },
];

// Group rules (triples, quads)
export const groupRules: GroupRule[] = [
  // Three or more players who've played together >=3 times and never won
  (group, matches) => {
    const ids = group.map((g) => g.id);
    let playedTogether = 0;
    let togetherWins = 0;
    matches.forEach((m) => {
      // check all present
      const found = ids.map((id) => findPlayerInMatch(m, id));
      if (found.some((f) => !f)) return;
      // ensure same team
      const teamId = found[0]!.teamId;
      if (!found.every((f) => f!.teamId === teamId)) return;
      playedTogether++;
      const teamScore = teamId === "A" ? m.score.teamA : m.score.teamB;
      const oppScore = teamId === "A" ? m.score.teamB : m.score.teamA;
      if (teamScore > oppScore) togetherWins++;
    });
    if (playedTogether >= 3 && togetherWins === 0) {
      return [
        {
          id: `group_curse_${ids.join("_")}`,
          type: "duo",
          relatedPlayerIds: ids,
          emoji: "☣️",
          category: "Curse",
          text: `${group.map((g) => g.name).join(", ")} have played together ${playedTogether} times and have never won.`,
          importance: 10,
        },
      ];
    }
    return [];
  },

  // Group always draws when together (>=4 matches together and all draws)
  (group, matches) => {
    const ids = group.map((g) => g.id);
    let playedTogether = 0;
    let allDraws = true;
    matches.forEach((m) => {
      const found = ids.map((id) => findPlayerInMatch(m, id));
      if (found.some((f) => !f)) return;
      const teamId = found[0]!.teamId;
      if (!found.every((f) => f!.teamId === teamId)) return;
      playedTogether++;
      const teamScore = teamId === "A" ? m.score.teamA : m.score.teamB;
      const oppScore = teamId === "A" ? m.score.teamB : m.score.teamA;
      if (teamScore !== oppScore) allDraws = false;
    });
    if (playedTogether >= 4 && allDraws) {
      return [
        {
          id: `group_draws_${ids.join("_")}`,
          type: "duo",
          relatedPlayerIds: ids,
          emoji: "🤝",
          category: "Form",
          text: `${group.map((g) => g.name).join(", ")} have drawn every time they've played together (${playedTogether} matches).`,
          importance: 8,
        },
      ];
    }
    return [];
  },

  // Group never scored when together (combined goals 0)
  (group, matches) => {
    const ids = group.map((g) => g.id);
    let playedTogether = 0;
    let combinedGoals = 0;
    matches.forEach((m) => {
      const found = ids.map((id) => findPlayerInMatch(m, id));
      if (found.some((f) => !f)) return;
      // require same team for 'together'
      const teamId = found[0]!.teamId;
      if (!found.every((f) => f!.teamId === teamId)) return;
      playedTogether++;
      combinedGoals += found.reduce((s, f) => s + safe(f!.stats.goals), 0);
    });
    if (playedTogether >= 3 && combinedGoals === 0) {
      return [
        {
          id: `group_noscore_${ids.join("_")}`,
          type: "duo",
          relatedPlayerIds: ids,
          emoji: "🔒",
          category: "Shame",
          text: `${group.map((g) => g.name).join(", ")} have played ${playedTogether} times together and collectively failed to score.`,
          importance: 9,
        },
      ];
    }
    return [];
  },

  // Two pairs who always draw against each other (a,b vs c,d)
  (group, matches) => {
    // only applies to groups of 4
    if (group.length !== 4) return [];
    const [a, b, c, d] = group;
    let played = 0;
    let allDraws = true;
    matches.forEach((m) => {
      const fA = findPlayerInMatch(m, a.id);
      const fB = findPlayerInMatch(m, b.id);
      const fC = findPlayerInMatch(m, c.id);
      const fD = findPlayerInMatch(m, d.id);
      if (!fA || !fB || !fC || !fD) return;
      // require a,b on same team and c,d on opposite
      if (
        fA.teamId === fB.teamId &&
        fC.teamId === fD.teamId &&
        fA.teamId !== fC.teamId
      ) {
        played++;
        const teamScore = fA.teamId === "A" ? m.score.teamA : m.score.teamB;
        const oppScore = fA.teamId === "A" ? m.score.teamB : m.score.teamA;
        if (teamScore !== oppScore) allDraws = false;
      }
    });
    if (played >= 3 && allDraws) {
      return [
        {
          id: `pair_draws_${a.id}_${b.id}_${c.id}_${d.id}`,
          type: "duo",
          relatedPlayerIds: [a.id, b.id, c.id, d.id],
          emoji: "🤝",
          category: "Form",
          text: `${a.name} & ${b.name} vs ${c.name} & ${d.name} have drawn in all ${played} encounters.`,
          importance: 9,
        },
      ];
    }
    return [];
  },

  // Group that wins every time together (>=3 wins)
  (group, matches) => {
    const ids = group.map((g) => g.id);
    let playedTogether = 0;
    let togetherWins = 0;
    matches.forEach((m) => {
      const found = ids.map((id) => findPlayerInMatch(m, id));
      if (found.some((f) => !f)) return;
      const teamId = found[0]!.teamId;
      if (!found.every((f) => f!.teamId === teamId)) return;
      playedTogether++;
      const teamScore = teamId === "A" ? m.score.teamA : m.score.teamB;
      const oppScore = teamId === "A" ? m.score.teamB : m.score.teamA;
      if (teamScore > oppScore) togetherWins++;
    });
    if (playedTogether >= 3 && togetherWins === playedTogether) {
      return [
        {
          id: `group_dominate_${ids.join("_")}`,
          type: "duo",
          relatedPlayerIds: ids,
          emoji: "🏆",
          category: "Glory",
          text: `${group.map((g) => g.name).join(", ")} have won every time they've played together (${playedTogether} matches).`,
          importance: 9,
        },
      ];
    }
    return [];
  },
  (group, matches) => {
    if (group.length !== 3) return [];
    const ids = group.map((g) => g.id);
    let playedTogether = 0;
    let togetherWins = 0;

    matches.forEach((m) => {
      const found = ids.map((id) => findPlayerInMatch(m, id));
      if (found.some((f) => !f)) return;
      const teamId = found[0]!.teamId;
      if (!found.every((f) => f!.teamId === teamId)) return;
      playedTogether++;
      const teamScore = teamId === "A" ? m.score.teamA : m.score.teamB;
      const oppScore = teamId === "A" ? m.score.teamB : m.score.teamA;
      if (teamScore > oppScore) togetherWins++;
    });

    if (playedTogether >= 3 && togetherWins === playedTogether) {
      return [
        {
          id: `golden_trio_${ids.join("_")}`,
          type: "duo",
          relatedPlayerIds: ids,
          emoji: "🔱",
          category: "Glory",
          text: `The Golden Trio! ${group.map((g) => g.name).join(", ")} are 100% victorious when playing together (${playedTogether} matches)!`,
          importance: 10,
        },
      ];
    }
    return [];
  },

  // 2. Defensive Disaster (Group of 3 on same team conceded 6+ goals in a match)
  (group, matches) => {
    if (group.length !== 3) return [];
    const ids = group.map((g) => g.id);
    const hits: NewsHeadline[] = [];

    matches.forEach((m) => {
      const found = ids.map((id) => findPlayerInMatch(m, id));
      if (found.some((f) => !f)) return;
      const teamId = found[0]!.teamId;
      if (!found.every((f) => f!.teamId === teamId)) return;
      const oppScore = teamId === "A" ? m.score.teamB : m.score.teamA;

      if (oppScore >= 6) {
        hits.push({
          id: `defensive_disaster_${ids.join("_")}_${m.id}`,
          type: "duo",
          relatedPlayerIds: ids,
          emoji: "🌊",
          category: "Shame",
          text: `Defensive collapse! ${group.map((g) => g.name).join(", ")} shipped ${oppScore} goals in a painful loss!`,
          importance: 8,
        });
      }
    });
    return hits;
  },

  // 3. All 8+ Rating Elite Performance (3 players together, all got rating >= 8.0)
  (group, matches) => {
    if (group.length !== 3) return [];
    const ids = group.map((g) => g.id);
    const hits: NewsHeadline[] = [];

    matches.forEach((m) => {
      const found = ids.map((id) => findPlayerInMatch(m, id));
      if (found.some((f) => !f)) return;
      const teamId = found[0]!.teamId;
      if (!found.every((f) => f!.teamId === teamId)) return;

      const all8Plus = found.every((f) => safe(f!.stats.playerRating) >= 8.0);
      if (all8Plus) {
        hits.push({
          id: `all_star_trio_${ids.join("_")}_${m.id}`,
          type: "duo",
          relatedPlayerIds: ids,
          emoji: "🌟",
          category: "Glory",
          text: `All-Star trio: ${group.map((g) => g.name).join(", ")} ALL put up 8.0+ ratings in the same game!`,
          importance: 9,
        });
      }
    });
    return hits;
  },

  // 4. Ghost Squad (3 players together, 0 goals, 0 assists, lost match)
  (group, matches) => {
    if (group.length !== 3) return [];
    const ids = group.map((g) => g.id);
    const hits: NewsHeadline[] = [];

    matches.forEach((m) => {
      const found = ids.map((id) => findPlayerInMatch(m, id));
      if (found.some((f) => !f)) return;
      const teamId = found[0]!.teamId;
      if (!found.every((f) => f!.teamId === teamId)) return;

      const teamScore = teamId === "A" ? m.score.teamA : m.score.teamB;
      const oppScore = teamId === "A" ? m.score.teamB : m.score.teamA;
      const totalGoals = found.reduce((s, f) => s + safe(f!.stats.goals), 0);
      const totalAssists = found.reduce(
        (s, f) => s + safe(f!.stats.assists),
        0,
      );

      if (teamScore < oppScore && totalGoals === 0 && totalAssists === 0) {
        hits.push({
          id: `ghost_squad_${ids.join("_")}_${m.id}`,
          type: "duo",
          relatedPlayerIds: ids,
          emoji: "👻",
          category: "Shame",
          text: `Ghost squad: ${group.map((g) => g.name).join(", ")} collectively registered ZERO goals and ZERO assists in a loss!`,
          importance: 8,
        });
      }
    });
    return hits;
  },

  // 5. Goal Monopoly Trio (3 players scored 100% of the team's goals in 2+ matches together)
  (group, matches) => {
    if (group.length !== 3) return [];
    const ids = group.map((g) => g.id);
    let monopolyGames = 0;

    matches.forEach((m) => {
      const found = ids.map((id) => findPlayerInMatch(m, id));
      if (found.some((f) => !f)) return;
      const teamId = found[0]!.teamId;
      if (!found.every((f) => f!.teamId === teamId)) return;

      const teamScore = teamId === "A" ? m.score.teamA : m.score.teamB;
      const groupGoals = found.reduce((s, f) => s + safe(f!.stats.goals), 0);

      if (teamScore >= 3 && groupGoals === teamScore) monopolyGames++;
    });

    if (monopolyGames >= 2) {
      return [
        {
          id: `trio_monopoly_${ids.join("_")}`,
          type: "duo",
          relatedPlayerIds: ids,
          emoji: "🎯",
          category: "Glory",
          text: `Total attack control: ${group.map((g) => g.name).join(", ")} scored EVERY SINGLE goal for their team in ${monopolyGames} different games!`,
          importance: 9,
        },
      ];
    }
    return [];
  },

  // 6. Clean Sheet Syndicate (3 players together kept clean sheet in 2+ matches)
  (group, matches) => {
    if (group.length !== 3) return [];
    const ids = group.map((g) => g.id);
    let cleanSheets = 0;

    matches.forEach((m) => {
      const found = ids.map((id) => findPlayerInMatch(m, id));
      if (found.some((f) => !f)) return;
      const teamId = found[0]!.teamId;
      if (!found.every((f) => f!.teamId === teamId)) return;

      const oppScore = teamId === "A" ? m.score.teamB : m.score.teamA;
      if (oppScore === 0) cleanSheets++;
    });

    if (cleanSheets >= 2) {
      return [
        {
          id: `clean_sheet_syndicate_${ids.join("_")}`,
          type: "duo",
          relatedPlayerIds: ids,
          emoji: "🛡️",
          category: "Glory",
          text: `Iron curtain: ${group.map((g) => g.name).join(", ")} have kept ${cleanSheets} clean sheets together!`,
          importance: 8,
        },
      ];
    }
    return [];
  },

  // 7. Chaotic Showdown Trio (3 players in matches averaging 8+ total goals)
  (group, matches) => {
    if (group.length !== 3) return [];
    const ids = group.map((g) => g.id);
    let matchesTogether = 0;
    let totalGoals = 0;

    matches.forEach((m) => {
      const found = ids.map((id) => findPlayerInMatch(m, id));
      if (found.some((f) => !f)) return;
      matchesTogether++;
      totalGoals += m.score.teamA + m.score.teamB;
    });

    if (matchesTogether >= 3 && totalGoals / matchesTogether >= 8.0) {
      return [
        {
          id: `chaotic_trio_${ids.join("_")}`,
          type: "duo",
          relatedPlayerIds: ids,
          emoji: "🔥",
          category: "Silly",
          text: `Pure chaos: Whenever ${group.map((g) => g.name).join(", ")} share a pitch, games average ${(totalGoals / matchesTogether).toFixed(1)} goals!`,
          importance: 8,
        },
      ];
    }
    return [];
  },

  // 8. Card Machine Trio (3 players all registered custom cards/punches in same match)
  (group, matches, customStats) => {
    if (group.length !== 3) return [];
    const ids = group.map((g) => g.id);
    const hits: NewsHeadline[] = [];

    matches.forEach((m) => {
      const found = ids.map((id) => findPlayerInMatch(m, id));
      if (found.some((f) => !f)) return;

      const allBadBoys = found.every((f) => {
        const cards =
          getCustomStatValue(f!.stats, "yellow cards", customStats) +
          getCustomStatValue(f!.stats, "red card", customStats) +
          getCustomStatValue(f!.stats, "punches", customStats);
        return cards > 0;
      });

      if (allBadBoys) {
        hits.push({
          id: `card_trio_${ids.join("_")}_${m.id}`,
          type: "duo",
          relatedPlayerIds: ids,
          emoji: "🥊",
          category: "Silly",
          text: `Enforcer group: ${group.map((g) => g.name).join(", ")} ALL picked up cards/punches in the same match!`,
          importance: 9,
        });
      }
    });
    return hits;
  },

  // 9. Clutch Victory Crew (3 players together won 2+ matches by 1 goal)
  (group, matches) => {
    if (group.length !== 3) return [];
    const ids = group.map((g) => g.id);
    let narrowWins = 0;

    matches.forEach((m) => {
      const found = ids.map((id) => findPlayerInMatch(m, id));
      if (found.some((f) => !f)) return;
      const teamId = found[0]!.teamId;
      if (!found.every((f) => f!.teamId === teamId)) return;

      const teamScore = teamId === "A" ? m.score.teamA : m.score.teamB;
      const oppScore = teamId === "A" ? m.score.teamB : m.score.teamA;
      if (teamScore - oppScore === 1) narrowWins++;
    });

    if (narrowWins >= 2) {
      return [
        {
          id: `clutch_crew_${ids.join("_")}`,
          type: "duo",
          relatedPlayerIds: ids,
          emoji: "⏳",
          category: "Glory",
          text: `Nail-biter specialists: ${group.map((g) => g.name).join(", ")} have ground out ${narrowWins} 1-goal victories together!`,
          importance: 7,
        },
      ];
    }
    return [];
  },

  // 10. The Eternal Draw Quartet (4 players together who have drawn 3+ matches together)
  (group, matches) => {
    if (group.length !== 4) return [];
    const ids = group.map((g) => g.id);
    let drawsTogether = 0;

    matches.forEach((m) => {
      const found = ids.map((id) => findPlayerInMatch(m, id));
      if (found.some((f) => !f)) return;
      const teamId = found[0]!.teamId;
      if (!found.every((f) => f!.teamId === teamId)) return;

      if (m.score.teamA === m.score.teamB) drawsTogether++;
    });

    if (drawsTogether >= 3) {
      return [
        {
          id: `quartet_draws_${ids.join("_")}`,
          type: "duo",
          relatedPlayerIds: ids,
          emoji: "🤝",
          category: "Form",
          text: `Peacekeepers: ${group.map((g) => g.name).join(", ")} have drawn ${drawsTogether} games when sharing the same squad!`,
          importance: 8,
        },
      ];
    }
    return [];
  },
];

export default {
  playerRules,
  duoRules,
};
