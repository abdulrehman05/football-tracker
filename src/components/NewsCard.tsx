import React from "react";
import { Card, Tag, Avatar, Tooltip, Badge } from "antd";
import {
  TrophyOutlined,
  RiseOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  SmileOutlined,
  UserOutlined,
  CalendarOutlined,
  ColumnWidthOutlined,
  FireFilled,
} from "@ant-design/icons";
import dayjs from "dayjs";

export interface NewsHeadline {
  id: string;
  type: "player" | "duo" | "league";
  playerId?: string;
  relatedPlayerIds?: string[];
  emoji: string;
  category: "Curse" | "Form" | "Shame" | "Glory" | "Silly";
  text: string;
  importance: number;
  statValue?: number;
  uniqueId?: string;
  matchId?: string;
  matchDate?: number;
}

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  birthday?: any;
  profilePictureUrl?: string;
  bio?: string;
  usualPosition?: string;
  createdAt: any;
}

export interface Match {
  id: string;
  date: any;
  duration?: number;
  format?: "5v5" | "7v7" | "9v9" | "11v11";
  location?: string;
  score: {
    teamA: number;
    teamB: number;
  };
  teams: any[];
  createdAt: any;
}

type Props = {
  headline: NewsHeadline;
  players: Player[];
  matches: Match[];
};

interface CategoryTheme {
  primary: string;
  secondary: string;
  bgGradient: string;
  border: string;
  glow: string;
  icon: React.ReactNode;
  label: string;
}

const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  Glory: {
    primary: "#d97706",
    secondary: "#fef3c7",
    bgGradient: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)",
    border: "rgba(245, 158, 11, 0.25)",
    glow: "rgba(245, 158, 11, 0.12)",
    icon: <TrophyOutlined style={{ fontSize: 20, color: "#d97706" }} />,
    label: "Glory",
  },
  Form: {
    primary: "#059669",
    secondary: "#d1fae5",
    bgGradient: "linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)",
    border: "rgba(16, 185, 129, 0.25)",
    glow: "rgba(16, 185, 129, 0.12)",
    icon: <RiseOutlined style={{ fontSize: 20, color: "#059669" }} />,
    label: "On Form",
  },
  Curse: {
    primary: "#7c3aed",
    secondary: "#ede9fe",
    bgGradient: "linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)",
    border: "rgba(139, 92, 246, 0.25)",
    glow: "rgba(139, 92, 246, 0.12)",
    icon: <ThunderboltOutlined style={{ fontSize: 20, color: "#7c3aed" }} />,
    label: "Curse",
  },
  Shame: {
    primary: "#dc2626",
    secondary: "#fee2e2",
    bgGradient: "linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)",
    border: "rgba(239, 68, 68, 0.25)",
    glow: "rgba(239, 68, 68, 0.12)",
    icon: <WarningOutlined style={{ fontSize: 20, color: "#dc2626" }} />,
    label: "Hall of Shame",
  },
  Silly: {
    primary: "#db2777",
    secondary: "#fce7f3",
    bgGradient: "linear-gradient(135deg, #ffffff 0%, #fdf2f8 100%)",
    border: "rgba(236, 72, 153, 0.25)",
    glow: "rgba(236, 72, 153, 0.12)",
    icon: <SmileOutlined style={{ fontSize: 20, color: "#db2777" }} />,
    label: "Silly Season",
  },
};

const DEFAULT_THEME: CategoryTheme = {
  primary: "#4b5563",
  secondary: "#f3f4f6",
  bgGradient: "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
  border: "rgba(107, 114, 128, 0.2)",
  glow: "rgba(107, 114, 128, 0.08)",
  icon: <UserOutlined style={{ fontSize: 20, color: "#4b5563" }} />,
  label: "General",
};

export default function NewsCard({ headline, players, matches }: Props) {
  const theme = CATEGORY_THEMES[headline.category] || DEFAULT_THEME;
  const isBreaking = headline.importance >= 9;

  const related = (headline.relatedPlayerIds || [])
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean) as Player[];

  let matchDateStr: string | null = null;
  if (headline.matchDate) {
    matchDateStr = dayjs(headline.matchDate).format("DD MMM YYYY");
  } else if (headline.matchId) {
    const m = matches.find((x) => x.id === headline.matchId);
    if (m) {
      matchDateStr = dayjs(
        (m.date as any)?.toDate ? (m.date as any).toDate() : (m.date as any),
      ).format("DD MMM YYYY");
    }
  }

  const cardContent = (
    <Card
      hoverable
      style={{
        borderRadius: 16,
        background: theme.bgGradient,
        border: `1px solid ${theme.border}`,
        boxShadow: `0 10px 25px -5px ${theme.glow}, 0 4px 6px -2px rgba(0, 0, 0, 0.03)`,
        overflow: "hidden",
        position: "relative",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      bodyStyle={{ padding: "16px 20px" }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: 5,
          backgroundColor: theme.primary,
        }}
      />

      <div style={{ paddingLeft: 6 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: theme.secondary,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                boxShadow: `inset 0 0 0 1px ${theme.border}`,
              }}
            >
              {theme.icon}
            </div>

            <div>
              <Tag
                bordered={false}
                style={{
                  backgroundColor: theme.secondary,
                  color: theme.primary,
                  fontWeight: 700,
                  fontSize: 11,
                  borderRadius: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginRight: 0,
                }}
              >
                {theme.label}
              </Tag>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {matchDateStr && (
              <span
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontWeight: 500,
                }}
              >
                <CalendarOutlined style={{ fontSize: 12 }} />
                {matchDateStr}
              </span>
            )}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <h4
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: "#0f172a",
              lineHeight: 1.4,
              letterSpacing: "-0.01em",
            }}
          >
            {headline.text}
          </h4>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 10,
            borderTop: "1px dashed rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {related.length > 0 ? (
              <Avatar.Group
                maxCount={3}
                maxStyle={{
                  color: theme.primary,
                  backgroundColor: theme.secondary,
                  fontSize: 11,
                  fontWeight: 600,
                  border: `2px solid #ffffff`,
                }}
              >
                {related.map((p) => (
                  <Tooltip title={p.name} key={p.id}>
                    <Avatar
                      size={26}
                      src={p.profilePictureUrl}
                      icon={<UserOutlined />}
                      style={{ border: `2px solid #ffffff` }}
                    />
                  </Tooltip>
                ))}
              </Avatar.Group>
            ) : (
              <span
                style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}
              >
                League wide
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {headline.statValue !== undefined && (
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: theme.primary,
                  backgroundColor: theme.secondary,
                  padding: "2px 8px",
                  borderRadius: 12,
                }}
              >
                {headline.statValue}
              </div>
            )}

            <Tooltip title="News Impact Rating">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 12,
                  fontWeight: 600,
                  color: headline.importance >= 8 ? "#dc2626" : "#6b7280",
                  backgroundColor: "#f3f4f6",
                  padding: "2px 6px",
                  borderRadius: 6,
                }}
              >
                <FireFilled
                  style={{
                    color: headline.importance >= 8 ? "#ef4444" : "#9ca3af",
                    fontSize: 11,
                  }}
                />
                {headline.importance.toFixed(1)}
              </div>
            </Tooltip>
          </div>
        </div>
      </div>
    </Card>
  );

  if (isBreaking) {
    return (
      <Badge.Ribbon
        text="BREAKING"
        color="#ef4444"
        style={{
          fontWeight: 800,
          letterSpacing: "0.5px",
          fontSize: 10,
          height: 22,
          lineHeight: "22px",
          boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)",
        }}
      >
        {cardContent}
      </Badge.Ribbon>
    );
  }

  return cardContent;
}
