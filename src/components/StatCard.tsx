// import { Card, Flex, List } from "antd";
// import type { AggregatedPlayer } from "../utils/dashboard";
// import type { Player } from "../types/Player";
// import type { CustomStat } from "../types/CustomStat";

// export default function StatCard({
//   title,
//   ranking,
//   players,
//   onViewAll,
//   stat,
// }: {
//   title: string;
//   ranking: AggregatedPlayer[];
//   players: Player[];
//   onViewAll: () => void;
//   stat: CustomStat | any;
// }) {
//   const getPlayer = (id: string) => players.find((p) => p.id === id);

//   return (
//     <Card title={title} extra={<a onClick={onViewAll}>View all</a>}>
//       <List
//         dataSource={ranking.slice(0, 5)}
//         renderItem={(r, i) => {
//           console.log({ stat });
//           const thisValue = stat.value(r);

//           const rank =
//             i === 0
//               ? 1
//               : stat.value(ranking[i - 1]) === thisValue
//               ? ranking
//                   .slice(0, i)
//                   .findIndex((p) => stat.value(p) === thisValue) + 1
//               : i + 1;

//           return (
//             <List.Item>
//               <Flex justify="space-between" style={{ width: "100%" }}>
//                 <Flex gap={8}>
//                   <strong>#{rank}</strong>
//                   {getPlayer(r.playerId)?.name}
//                 </Flex>
//                 <Flex>
//                   {Number.isFinite(thisValue)
//                     ? thisValue.toFixed(2)
//                     : thisValue}
//                 </Flex>
//               </Flex>
//             </List.Item>
//           );
//         }}
//       />
//     </Card>
//   );
// }

import { Card, Flex, List, Avatar, Typography, Button, Space } from "antd";
import { TrophyOutlined, RightOutlined } from "@ant-design/icons";
import { applyCompetitionRanking } from "../utils/dashboard";

const { Text } = Typography;

export const getRankColor = (index: number) => {
  if (index === 1) return "#FFD700"; // Gold
  if (index === 2) return "#C0C0C0"; // Silver
  if (index === 3) return "#CD7F32"; // Bronze
  return "#8c8c8c";
};
export default function StatCard({
  title,
  ranking,
  players,
  onViewAll,
  stat,
}: any) {
  const getPlayer = (id: string) => players.find((p: any) => p.id === id);

  const rankedDataSource = applyCompetitionRanking(ranking, stat.value) as any;
  return (
    <Card
      title={
        <Space>
          <TrophyOutlined style={{ color: "#faad14" }} />
          {title}
        </Space>
      }
      extra={
        <Button type="link" onClick={onViewAll} icon={<RightOutlined />}>
          Full List
        </Button>
      }
      bodyStyle={{ padding: "0 16px" }}
      style={{
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
        border: "1px solid #f0f0f0",
      }}
    >
      <List
        dataSource={rankedDataSource.slice(0, 5)}
        renderItem={(r: any, i) => {
          const p = getPlayer(r?.playerId as any);
          const thisValue = stat.value(r);

          return (
            <List.Item
              style={{
                padding: "12px 0",
                borderBottom: i === 4 ? "none" : "1px solid #f5f5f5",
              }}
            >
              <Flex
                justify="space-between"
                align="center"
                style={{ width: "100%" }}
              >
                <Flex align="center" gap={12}>
                  <div style={{ width: 24, textAlign: "center" }}>
                    <Text
                      strong
                      style={{
                        color: getRankColor(r?.rank),
                        fontSize: 16,
                        fontWeight: "bold",
                      }}
                    >
                      {r?.rank}
                    </Text>
                  </div>
                  <Avatar src={p?.profilePictureUrl} size="small" />
                  <Text strong>{p?.name || "Unknown"}</Text>
                </Flex>
                <div
                  style={{
                    background: "#f0f5ff",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  <Text strong style={{ color: "#0050b3" }}>
                    {Number.isFinite(thisValue)
                      ? thisValue.toFixed(1)
                      : thisValue}
                  </Text>
                </div>
              </Flex>
            </List.Item>
          );
        }}
      />
    </Card>
  );
}
