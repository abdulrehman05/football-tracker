import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Select,
  Typography,
  Space,
  Tag,
  Spin,
  Empty,
  Segmented,
  Input,
  Avatar,
  Badge,
  Modal,
  List,
} from "antd";
import {
  FireOutlined,
  ThunderboltOutlined,
  UserOutlined,
  SearchOutlined,
  NotificationOutlined,
} from "@ant-design/icons";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";

import type { Match } from "../types/match";
import type { Player } from "../types/Player";
import type { CustomStat } from "../types/CustomStat";
import {
  generateIntertwinedNews,
  generatePlayerNews,
} from "../utils/newsEngine";
import type { NewsHeadline } from "../utils/newsRules";

const { Title, Text, Paragraph } = Typography;

export default function NewsFeed() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [customStats, setCustomStats] = useState<CustomStat[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("Breaking");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [activeHeadline, setActiveHeadline] = useState<NewsHeadline | null>(
    null,
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [mDocs, pDocs, cDocs] = await Promise.all([
        getDocs(collection(db, "matches")),
        getDocs(collection(db, "players")),
        getDocs(collection(db, "customStats")),
      ]);

      setMatches(mDocs.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      setPlayers(pDocs.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      setCustomStats(
        cDocs.docs.map((d) => ({ id: d.id, ...(d.data() as any) })),
      );
      setLoading(false);
    };
    load();
  }, []);

  // Generate all headlines dynamically
  const allHeadlines = useMemo(() => {
    if (loading) return [];

    const headlines: NewsHeadline[] = [];

    // Player specific ones
    players.forEach((p) => {
      headlines.push(...generatePlayerNews(p, matches, customStats));
    });

    // Intertwined duo ones
    headlines.push(...generateIntertwinedNews(players, matches, customStats));

    // Sort by importance / spiciness
    return headlines.sort((a, b) => b.importance - a.importance);
  }, [matches, players, customStats, loading]);

  // Filtered headlines based on user interaction
  const displayedHeadlines = useMemo(() => {
    return allHeadlines.filter((h) => {
      // Player filter
      if (selectedPlayerId) {
        const matchesSingle = h.playerId === selectedPlayerId;
        const matchesDuo = h.relatedPlayerIds?.includes(selectedPlayerId);
        if (!matchesSingle && !matchesDuo) return false;
      }

      // Category filter
      if (categoryFilter !== "All") {
        if (categoryFilter === "Breaking") {
          // When filtering by a player, still include that player's related headlines
          if (selectedPlayerId) {
            const matchesSingle = h.playerId === selectedPlayerId;
            const matchesDuo = h.relatedPlayerIds?.includes(selectedPlayerId);
            if (!h.importance || h.importance < 9) {
              if (!matchesSingle && !matchesDuo) return false;
            }
          } else {
            if (!h.importance || h.importance < 9) return false;
          }
        } else if (categoryFilter === "Groups") {
          const isGroup = (h.relatedPlayerIds || []).length >= 2;
          if (!isGroup) return false;
        } else {
          if (h.category !== categoryFilter) return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return h.text.toLowerCase().includes(q);
      }

      return true;
    });
  }, [allHeadlines, selectedPlayerId, categoryFilter, searchQuery]);

  // Compute which tabs should be shown based on available headlines
  const tabOptions = useMemo(() => {
    const filteredForTabs = allHeadlines.filter((h) => {
      if (!selectedPlayerId) return true;
      const matchesSingle = h.playerId === selectedPlayerId;
      const matchesDuo = h.relatedPlayerIds?.includes(selectedPlayerId);
      return matchesSingle || !!matchesDuo;
    });

    const hasBreaking = filteredForTabs.some((h) => (h.importance || 0) >= 9);
    const hasGroups = filteredForTabs.some(
      (h) => (h.relatedPlayerIds || []).length >= 2,
    );
    const presentCategories = new Set(filteredForTabs.map((h) => h.category));

    const options: string[] = ["All"];
    if (hasBreaking) options.push("Breaking");
    if (hasGroups) options.push("Groups");
    ["Curse", "Glory", "Shame", "Form", "Silly"].forEach((c) => {
      if (presentCategories.has(c as any)) options.push(c);
    });
    return options;
  }, [allHeadlines, selectedPlayerId]);

  useEffect(() => {
    if (!tabOptions.includes(categoryFilter)) {
      setCategoryFilter("All");
    }
  }, [tabOptions]);

  const categoryColors: Record<string, string> = {
    Curse: "volcano",
    Shame: "magenta",
    Glory: "gold",
    Form: "green",
    Silly: "purple",
    Breaking: "red",
  };

  if (loading) {
    return (
      <div style={{ height: "70vh", display: "grid", placeItems: "center" }}>
        <Spin size="large" tip="Generating match gossip & silly stats..." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 60 }}>
      {/* Header */}
      <Space direction="vertical" style={{ width: "100%", marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <NotificationOutlined style={{ color: "#ff4d4f", marginRight: 8 }} />
          Ball Knowledge Gazette
        </Title>
      </Space>

      {/* Filter Toolbar */}
      <Card
        style={{
          borderRadius: 12,
          marginBottom: 24,
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "space-between",
            }}
          >
            {/* Player Selector */}
            <Select
              allowClear
              showSearch
              placeholder="Filter by Player..."
              style={{ width: 240 }}
              value={selectedPlayerId}
              onChange={setSelectedPlayerId}
              optionFilterProp="children"
            >
              {players.map((p) => (
                <Select.Option key={p.id} value={p.id}>
                  <Space>
                    <Avatar
                      size="small"
                      icon={<UserOutlined />}
                      src={p.profilePictureUrl}
                    />
                    {p.name}
                  </Space>
                </Select.Option>
              ))}
            </Select>

            {/* Search Input */}
            <Input
              placeholder="Search news..."
              prefix={<SearchOutlined />}
              style={{ width: 220 }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </div>

          <Segmented
            options={tabOptions}
            value={categoryFilter}
            onChange={(val) => setCategoryFilter(val as string)}
            block
          />
        </Space>
      </Card>

      {/* News Feed Cards */}
      {displayedHeadlines.length === 0 ? (
        <Empty description="No spicy news or stats found matching your filters!" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {displayedHeadlines.map((headline, idx) => (
            <Card
              hoverable
              onClick={() => {
                setActiveHeadline(headline);
                setModalVisible(true);
              }}
              style={{
                borderRadius: 10,
                padding: 14,
                boxShadow: "0 6px 18px rgba(17,17,26,0.04)",
                border: "1px solid rgba(0,0,0,0.04)",
                cursor: "pointer",
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "space-between",
                  gap: 16,
                }}
              >
                <span style={{ fontSize: 32, lineHeight: 1 }}>
                  {headline.emoji}
                </span>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <Tag color={categoryColors[headline.category]}>
                      {headline.category}
                    </Tag>

                    {headline.importance >= 9 && (
                      <Tag icon={<FireOutlined />} color="error">
                        BREAKING
                      </Tag>
                    )}
                  </div>

                  <Paragraph
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      margin: 0,
                      color: "#111827",
                      lineHeight: 1.25,
                    }}
                  >
                    {headline.text}
                  </Paragraph>

                  <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                    {(headline.relatedPlayerIds || []).slice(0, 4).map((id) => {
                      const p = players.find((x) => x.id === id);
                      return (
                        <Avatar
                          key={id}
                          size={24}
                          src={p?.profilePictureUrl}
                          icon={<UserOutlined />}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {/* Detail Modal */}
      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={720}
        bodyStyle={{ padding: 24 }}
        title={activeHeadline?.text}
      >
        {activeHeadline ? (
          <div>
            <div style={{ marginBottom: 12 }}>
              <Tag color={categoryColors[activeHeadline.category]}>
                {activeHeadline.category}
              </Tag>
              <Tag>{activeHeadline.importance} importance</Tag>
            </div>

            <div style={{ marginBottom: 12 }}>
              <strong>Related players:</strong>{" "}
              {(activeHeadline.relatedPlayerIds || [activeHeadline.playerId])
                .filter(Boolean)
                .map((id) => players.find((p) => p.id === id))
                .filter(Boolean)
                .map((p) => p!.name)
                .join(", ") || "—"}
            </div>

            <div style={{ marginBottom: 8 }}>
              <strong>Relevant matches</strong>
            </div>
            <List
              size="small"
              dataSource={matches
                .filter((m) => {
                  if (activeHeadline.playerId) {
                    return m.teams.some((t) =>
                      t.players?.some(
                        (pl) => pl.playerId === activeHeadline.playerId,
                      ),
                    );
                  }
                  const ids = activeHeadline.relatedPlayerIds || [];
                  if (ids.length === 0) return false;
                  return ids.every((id) =>
                    m.teams.some((t) =>
                      t.players?.some((pl) => pl.playerId === id),
                    ),
                  );
                })
                .sort((a, b) => {
                  const da = (a.date as any)?.toDate
                    ? (a.date as any).toDate().getTime()
                    : new Date((a as any).date).getTime();
                  const db = (b.date as any)?.toDate
                    ? (b.date as any).toDate().getTime()
                    : new Date((b as any).date).getTime();
                  return db - da;
                })
                .slice(0, 8)
                .map((m) => m)}
              renderItem={(m: Match) => (
                <List.Item>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <div>
                      {m.teams?.[0]?.name || "Team A"} vs{" "}
                      {m.teams?.[1]?.name || "Team B"}
                      <div style={{ color: "#777", fontSize: 12 }}>
                        {dayjs(
                          (m.date as any)?.toDate
                            ? (m.date as any).toDate()
                            : (m.date as any),
                        ).format("DD MMM YYYY")}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700 }}>
                      {m.score.teamA} - {m.score.teamB}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
