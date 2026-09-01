import React, { useMemo, useState, useEffect } from "react";
import { Card, Row, Col, Typography, Button, Space, Avatar, List } from "antd";
import { motion } from "framer-motion";
import type { AggregatedPlayer } from "../utils/dashboard";
import { avgRating, winPct } from "../utils/dashboard";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import type { Match } from "../types/match";
import type { Player } from "../types/Player";
import type { CustomStat } from "../types/CustomStat";
import { aggregateMatches, consistency } from "../utils/dashboard";

const { Title, Text } = Typography;

// Calculate individual score for balancing
export function getPlayerSkillScore(p: AggregatedPlayer): number {
  // Handle players with no matches gracefully
  const matchesPlayed = p.matches || 0;

  // 1) Rating-based score (0-100)
  const ratingScore = avgRating(p) * 10;

  // 2) Consistency (favor steady high performers). Scale and clamp
  const consistencyScore = Math.max(0, Math.min(100, consistency(p) * 12));

  // 3) Involvement: goals+assists per match -> scale to 0-100
  const goals = p.totals?.goals || 0;
  const assists = p.totals?.assists || 0;
  const involvementPerMatch = matchesPlayed
    ? (goals + assists) / matchesPlayed
    : 0;
  const involvementScore = Math.max(0, Math.min(100, involvementPerMatch * 25));

  // 4) Totals (gives weight to prolific scorers)
  const goalsTotalScore = Math.max(0, Math.min(100, goals * 8));
  const assistsTotalScore = Math.max(0, Math.min(100, assists * 6));

  // 5) Shots on target ratio (if available)
  const shots = p.totals?.shots || 0;
  const shotsOnTarget = p.totals?.shotsOnTarget || 0;
  const onTargetPercent = shots ? (shotsOnTarget / shots) * 100 : 0;
  const onTargetScore = Math.max(0, Math.min(100, onTargetPercent));

  // 6) Experience (matches played) - scaled (30+ matches ~= 100)
  const experienceScore = Math.max(
    0,
    Math.min(100, (matchesPlayed / 30) * 100),
  );

  // 7) Win percentage (team stat — give small weight)
  const winScore = winPct(p);

  // 8) Custom stats aggregate (small bonus)
  const customSum = Object.values(p.customTotals || {}).reduce(
    (s, v) => s + (v || 0),
    0,
  );
  const customScore = Math.max(0, Math.min(100, customSum * 5));

  // Composite weights (tuned): rating, involvement, consistency, totals, experience, small win/custom/on-target
  const composite =
    ratingScore * 0.47 +
    involvementScore * 0.13 +
    consistencyScore * 0.16 +
    goalsTotalScore * 0.05 +
    assistsTotalScore * 0.05 +
    experienceScore * 0.07 +
    onTargetScore * 0.04 +
    winScore * 0.03 +
    customScore * 0.0;

  return Number(Math.max(0, Math.min(100, composite)).toFixed(1));
}

export const TeamBalancer: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [teams, setTeams] = useState<{
    teamA: AggregatedPlayer[];
    teamB: AggregatedPlayer[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [rawPlayers, setRawPlayers] = useState<Player[]>([]);
  const [customStats, setCustomStats] = useState<CustomStat[]>([]);

  const togglePlayer = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id],
    );
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setTeams(null);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [mSnap, pSnap, cSnap] = await Promise.all([
          getDocs(collection(db, "matches")),
          getDocs(collection(db, "players")),
          getDocs(collection(db, "customStats")),
        ]);

        setMatches(
          mSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          })) as Match[],
        );

        setRawPlayers(
          pSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          })) as Player[],
        );

        setCustomStats(
          cSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          })) as CustomStat[],
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const balanceTeams = () => {
    const selected = aggregatedPlayers.filter((p) =>
      selectedIds.includes(p.playerId),
    );
    if (!selected.length) return;

    // Sort players by skill score descending
    const sorted = [...selected].sort(
      (a, b) => getPlayerSkillScore(b) - getPlayerSkillScore(a),
    );

    const teamA: AggregatedPlayer[] = [];
    const teamB: AggregatedPlayer[] = [];
    let scoreA = 0;
    let scoreB = 0;

    // Snake allocation to equalize team strengths
    sorted.forEach((player) => {
      const score = getPlayerSkillScore(player);
      if (scoreA <= scoreB) {
        teamA.push(player);
        scoreA += score;
      } else {
        teamB.push(player);
        scoreB += score;
      }
    });

    // Enforce team size constraints: prefer difference 0-1, allow 2 when teams would have >5 players
    const N = selected.length;
    const allowDiff = Math.ceil(N / 2) > 5 ? 2 : 1; // if more than 5 per team (total>10) allow 2

    // Move lowest contributing players from larger team to smaller until size within allowed difference
    const moveLowest = (from: AggregatedPlayer[], to: AggregatedPlayer[]) => {
      from.sort((a, b) => getPlayerSkillScore(a) - getPlayerSkillScore(b));
      const mover = from.shift();
      if (mover) to.push(mover);
    };

    while (Math.abs(teamA.length - teamB.length) > allowDiff) {
      if (teamA.length > teamB.length) moveLowest(teamA, teamB);
      else moveLowest(teamB, teamA);
    }

    setTeams({ teamA, teamB });
  };

  const getTeamAvgScore = (team: AggregatedPlayer[]) => {
    return team.length
      ? (
          team.reduce((acc, p) => acc + getPlayerSkillScore(p), 0) / team.length
        ).toFixed(1)
      : "0";
  };

  const aggregatedPlayers = useMemo(
    () => Object.values(aggregateMatches(matches, customStats, rawPlayers)),
    [matches, customStats, rawPlayers],
  );

  const selectedPlayers = useMemo(
    () => aggregatedPlayers.filter((p) => selectedIds.includes(p.playerId)),
    [aggregatedPlayers, selectedIds],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: "20px 0" }}
    >
      <Title level={2}>Team Balancer</Title>
      <Text type="secondary">
        Select players present and generate two balanced sides.
      </Text>

      {loading ? (
        <Card style={{ marginTop: 16, borderRadius: 12 }} loading />
      ) : (
        <Card
          style={{ marginTop: 16, borderRadius: 12 }}
          bodyStyle={{ padding: 16 }}
        >
          <div
            style={{
              marginBottom: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <Text strong>Select present players</Text>
              <div style={{ marginTop: 6 }}>
                <Text type="secondary">{selectedIds.length} selected</Text>
              </div>
            </div>
            <Space>
              <Button onClick={clearSelection}>Clear</Button>
              <Button
                type="primary"
                onClick={balanceTeams}
                disabled={selectedIds.length < 2}
              >
                Generate Teams
              </Button>
            </Space>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {aggregatedPlayers.map((p) => {
              const isSelected = selectedIds.includes(p.playerId);
              const name = p.playerObject?.name || p.playerId;
              return (
                !name.includes("placeholder") && (
                  <Button
                    key={p.playerId}
                    onClick={() => togglePlayer(p.playerId)}
                    type={isSelected ? "primary" : "default"}
                    style={{ borderRadius: 20 }}
                  >
                    <Space>
                      <Avatar
                        size={20}
                        src={p.playerObject?.profilePictureUrl}
                      />
                      <span style={{ minWidth: 120, textAlign: "left" }}>
                        {name}
                      </span>
                      <small
                        style={{
                          color: isSelected ? "#fff" : "rgba(0,0,0,0.45)",
                        }}
                      >
                        {getPlayerSkillScore(p)}
                      </small>
                    </Space>
                  </Button>
                )
              );
            })}
          </div>

          {teams && (
            <Row gutter={16} style={{ marginTop: 20 }}>
              <Col xs={24} md={12}>
                <Card
                  title={`Team A — ${teams.teamA.length} players`}
                  bordered={false}
                  style={{ borderRadius: 12 }}
                >
                  <Text type="secondary">
                    Avg: {getTeamAvgScore(teams.teamA)} — Total:{" "}
                    {teams.teamA
                      .reduce((s, p) => s + getPlayerSkillScore(p), 0)
                      .toFixed(1)}
                  </Text>
                  <List
                    itemLayout="horizontal"
                    dataSource={teams.teamA}
                    renderItem={(p) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <Avatar src={p.playerObject?.profilePictureUrl} />
                          }
                          title={p.playerObject?.name || p.playerId}
                          description={`Score: ${getPlayerSkillScore(p)} — Matches: ${p.matches}`}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card
                  title={`Team B — ${teams.teamB.length} players`}
                  bordered={false}
                  style={{ borderRadius: 12 }}
                >
                  <Text type="secondary">
                    Avg: {getTeamAvgScore(teams.teamB)} — Total:{" "}
                    {teams.teamB
                      .reduce((s, p) => s + getPlayerSkillScore(p), 0)
                      .toFixed(1)}
                  </Text>
                  <List
                    itemLayout="horizontal"
                    dataSource={teams.teamB}
                    renderItem={(p) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <Avatar src={p.playerObject?.profilePictureUrl} />
                          }
                          title={p.playerObject?.name || p.playerId}
                          description={`Score: ${getPlayerSkillScore(p)} — Matches: ${p.matches}`}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          )}
        </Card>
      )}
    </motion.div>
  );
};

export default TeamBalancer;
