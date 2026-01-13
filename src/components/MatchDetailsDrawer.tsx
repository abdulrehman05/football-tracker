// import { Avatar, Drawer, Table, Tag, Typography } from "antd";
// import dayjs from "dayjs";
// import type { Match } from "../types/match";
// import { useEffect, useState } from "react";
// import { collection, getDocs } from "firebase/firestore";
// import { db } from "../firebase";
// import type { Player } from "../types/Player";
// import type { CustomStat } from "../types/CustomStat";
// import { allStats, type MatchPlayer } from "../types/matchplayer";

// export default function MatchDetailsDrawer({
//   match,
//   onClose,
//   customStats,
//   players,
// }: {
//   match: Match | null;
//   onClose: () => void;
//   customStats: CustomStat[];
//   players: Player[];
// }) {
//   const getPlayer = (id: string) => players.find((p) => p.id === id);

//   return (
//     <Drawer
//       open={!!match}
//       onClose={onClose}
//       width={"100%"}
//       title="Match Details"
//     >
//       {match && (
//         <>
//           <Typography.Title level={5}>
//             {dayjs(match.date.toDate()).format("DD MMM YYYY")}
//           </Typography.Title>

//           <Typography.Text>
//             {match.location || "Unknown location"}
//           </Typography.Text>

//           <div style={{ margin: "12px 0" }}>
//             <Tag>{match.format || "Friendly"}</Tag>
//             <Tag color="blue">
//               {match.score.teamA} - {match.score.teamB}
//             </Tag>
//           </div>

//           {match.teams.map((team) => (
//             <Table
//               key={team.id}
//               size="small"
//               pagination={false}
//               title={() => team.name}
//               rowKey="playerId"
//               dataSource={team.players}
//               style={{ marginBottom: 24 }}
//               columns={[
//                 {
//                   title: "Player",
//                   render: (_, r: MatchPlayer) => {
//                     const p = getPlayer(r.playerId);
//                     return (
//                       <>
//                         <Avatar src={p?.profilePictureUrl} /> {p?.name}
//                       </>
//                     );
//                   },
//                 },
//                 ...allStats.map((cs) => ({
//                   title: cs,
//                   render: (_: any, r: MatchPlayer) => r?.[cs] ?? "—",
//                 })),
//                 ...customStats.map((cs) => ({
//                   title: cs.name,
//                   render: (_: any, r: MatchPlayer) =>
//                     r.customStats?.find((s) => s.statId === cs.id)?.value ??
//                     "—",
//                 })),
//               ]}
//             />
//           ))}
//         </>
//       )}
//     </Drawer>
//   );
// }

import {
  Avatar,
  Drawer,
  Table,
  Tag,
  Typography,
  Row,
  Col,
  Divider,
  Tabs,
  Space,
  Statistic,
  Button,
  Tooltip,
} from "antd";
import {
  EnvironmentOutlined,
  CalendarOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { Match } from "../types/match";
import type { Player } from "../types/Player";
import type { CustomStat } from "../types/CustomStat";
import { allStats, toTitle, type MatchPlayer } from "../types/matchplayer";
import { motion } from "framer-motion";

const { Title, Text } = Typography;

export default function MatchDetailsDrawer({
  match,
  onClose,
  customStats,
  players,
}: {
  match: Match | null;
  onClose: () => void;
  customStats: CustomStat[];
  players: Player[];
}) {
  const getPlayer = (id: string) => players.find((p) => p.id === id);

  // Helper to build columns for both standard and custom stats
  const getColumns = () => [
    {
      title: "Player",
      key: "player",
      fixed: "left" as const,
      width: 180,
      render: (_: any, r: MatchPlayer) => {
        const p = getPlayer(r.playerId);
        return (
          <Space>
            <Avatar src={p?.profilePictureUrl} icon={<UserOutlined />} />
            <div style={{ lineHeight: 1 }}>
              <Text strong style={{ display: "block" }}>
                {p?.name}
              </Text>
              <Text type="secondary" style={{ fontSize: "11px" }}>
                {p?.usualPosition}
              </Text>
            </div>
          </Space>
        );
      },
    },
    ...allStats.map((statKey) => ({
      title: <TooltipHeader title={statKey} />,
      dataIndex: statKey,
      key: statKey,
      align: "center" as const,
      width: 70,
      render: (val: any) => (
        <Text strong style={{ color: val > 0 ? "#1890ff" : "#bfbfbf" }}>
          {val ?? 0}
        </Text>
      ),
    })),
    ...customStats.map((cs) => ({
      title: cs.name,
      key: cs.id,
      align: "center" as const,
      width: 100,
      render: (_: any, r: MatchPlayer) => {
        const val = r.customStats?.find((s) => s.statId === cs.id)?.value;
        return <Tag color={val ? "gold" : "default"}>{val ?? "—"}</Tag>;
      },
    })),
  ];

  const TooltipHeader = ({ title }: { title: string }) => {
    const getDisplayName = (str: string) => {
      const words = str.trim().split(/\s+/);
      if (words.length > 1) {
        return words.map((word) => word[0]).join("");
      }
      return str.slice(0, 3);
    };
    return (
      <Tooltip title={toTitle(title)}>
        <span style={{ fontSize: "12px", textTransform: "uppercase" }}>
          {getDisplayName(toTitle(title))}
        </span>
      </Tooltip>
    );
  };

  return (
    <Drawer
      open={!!match}
      onClose={onClose}
      width={window.innerWidth > 768 ? 720 : "100%"}
      title={null} // Custom header
      styles={{ body: { padding: 0 } }}
      closeIcon={null}
    >
      {match && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Header Section: The Scoreboard */}
          <div
            style={{
              background: "linear-gradient(180deg, #001529 0%, #002140 100%)",
              padding: "40px 24px",
              color: "white",
              textAlign: "center",
            }}
          >
            <Space direction="vertical" style={{ width: "100%" }} size={16}>
              <Text
                style={{
                  color: "rgba(255,255,255,0.65)",
                  textTransform: "uppercase",
                  letterSpacing: 2,
                }}
              >
                {match.format || "Match Results"}
              </Text>

              <Row gutter={24} align="middle" justify="center">
                <Col span={8}>
                  <Title level={2} style={{ color: "white", margin: 0 }}>
                    {match.teams[0].name}
                  </Title>
                </Col>
                <Col span={8}>
                  <div
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      padding: "8px 20px",
                      borderRadius: 12,
                      display: "inline-block",
                    }}
                  >
                    <Title
                      level={1}
                      style={{ color: "#1890ff", margin: 0, letterSpacing: 4 }}
                    >
                      {match.score.teamA} : {match.score.teamB}
                    </Title>
                  </div>
                </Col>
                <Col span={8}>
                  <Title level={2} style={{ color: "white", margin: 0 }}>
                    {match.teams[1].name}
                  </Title>
                </Col>
              </Row>

              <Space
                split={
                  <Divider
                    type="vertical"
                    style={{ borderColor: "rgba(255,255,255,0.2)" }}
                  />
                }
              >
                <Text style={{ color: "white" }}>
                  <CalendarOutlined />{" "}
                  {dayjs(match.date.toDate()).format("DD MMM YYYY")}
                </Text>
                <Text style={{ color: "white" }}>
                  <EnvironmentOutlined /> {match.location || "Home Pitch"}
                </Text>
              </Space>
            </Space>
          </div>

          {/* Body Section: Performance Stats */}
          <div style={{ padding: "24px" }}>
            <Title level={4}>
              <TrophyOutlined /> Player Performance
            </Title>
            <Tabs
              defaultActiveKey="0"
              type="card"
              items={match.teams.map((team, index) => ({
                label: `Team ${index === 0 ? "A" : "B"} (${team.name})`,
                key: index.toString(),
                children: (
                  <Table
                    dataSource={team.players}
                    columns={getColumns()}
                    pagination={false}
                    size="small"
                    scroll={{ x: 600 }}
                    rowKey="playerId"
                    bordered
                  />
                ),
              }))}
            />
          </div>

          <div style={{ padding: "0 24px 24px", textAlign: "right" }}>
            <Button onClick={onClose} size="large">
              Close Report
            </Button>
          </div>
        </motion.div>
      )}
    </Drawer>
  );
}
