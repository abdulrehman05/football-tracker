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

import type { Match } from "../types/match";
import type { Player } from "../types/Player";
import type { CustomStat } from "../types/CustomStat";
import {
  generateIntertwinedNews,
  generatePlayerNews,
  type NewsHeadline,
} from "../utils/newsEngine";

const { Title, Text, Paragraph } = Typography;

export default function NewsFeed() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [customStats, setCustomStats] = useState<CustomStat[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

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
      if (categoryFilter !== "All" && h.category !== categoryFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return h.text.toLowerCase().includes(q);
      }

      return true;
    });
  }, [allHeadlines, selectedPlayerId, categoryFilter, searchQuery]);

  const categoryColors: Record<string, string> = {
    Curse: "volcano",
    Shame: "magenta",
    Glory: "gold",
    Form: "green",
    Silly: "purple",
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

          {/* Category Tabs */}
          <Segmented
            options={["All", "Curse", "Glory", "Shame", "Form", "Silly"]}
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
        <AnimatePresence>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {displayedHeadlines.map((headline, idx) => (
              <motion.div
                key={headline.id + idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.3) }}
              >
                <Card
                  hoverable
                  style={{
                    borderRadius: 12,
                    borderLeft: `6px solid ${
                      headline.category === "Curse"
                        ? "#ff4d4f"
                        : headline.category === "Glory"
                          ? "#faad14"
                          : headline.category === "Shame"
                            ? "#eb2f96"
                            : "#52c41a"
                    }`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
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
                          fontSize: 16,
                          fontWeight: 600,
                          margin: 0,
                          color: "#1f1f1f",
                        }}
                      >
                        {headline.text}
                      </Paragraph>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
