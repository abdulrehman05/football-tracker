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

// Reusable small helpers
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
];

export default {
  playerRules,
  duoRules,
};
