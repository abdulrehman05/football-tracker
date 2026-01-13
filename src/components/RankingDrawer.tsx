// import { Drawer, Table } from "antd";
// import type { AggregatedPlayer } from "../utils/dashboard";
// import type { Player } from "../types/Player";

// export default function RankingDrawer({
//   open,
//   title,
//   ranking,
//   players,
//   unit,
//   value,
//   onClose,
// }: {
//   open: boolean;
//   title: string;
//   ranking: AggregatedPlayer[];
//   players: Player[];
//   unit?: any;
//   value: (p: AggregatedPlayer) => number;
//   onClose: () => void;
// }) {
//   const getPlayer = (id: string) => players.find((p) => p.id === id);

//   return (
//     <Drawer open={open} onClose={onClose} width="100%" title={title}>
//       <Table
//         rowKey="playerId"
//         dataSource={ranking}
//         pagination={false}
//         columns={[
//           {
//             title: "Rank",
//             render: (_, r, i) => {
//               const thisValue = value(r);

//               const rank =
//                 i === 0
//                   ? 1
//                   : value(ranking[i - 1]) === thisValue
//                   ? ranking
//                       .slice(0, i)
//                       .findIndex((p) => value(p) === thisValue) + 1
//                   : i + 1;

//               return rank;
//             },
//           },
//           {
//             title: "Player",
//             render: (_, r) => getPlayer(r.playerId)?.name,
//           },
//           {
//             title: "Value",
//             render: (_, r) =>
//               unit ? `${value(r).toFixed(2)} ${unit}` : value(r).toFixed(2),
//           },
//         ]}
//       />
//     </Drawer>
//   );
// }

import { Drawer, Table, Avatar, Typography, Space, Tag } from "antd";
import {
  applyCompetitionRanking,
  type AggregatedPlayer,
} from "../utils/dashboard";
import type { Player } from "../types/Player";

const { Text } = Typography;

export default function RankingDrawer({
  open,
  title,
  ranking,
  players,
  unit,
  value,
  onClose,
}: any) {
  const getPlayer = (id: string) => players.find((p: any) => p.id === id);
  const rankedDataSource = applyCompetitionRanking(ranking, value) as any;
  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={600}
      title={
        <Text strong style={{ fontSize: 20 }}>
          {title} Leaderboard
        </Text>
      }
      headerStyle={{ borderBottom: "1px solid #f0f0f0" }}
    >
      <Table
        rowKey="playerId"
        dataSource={rankedDataSource}
        pagination={{ pageSize: 15 }}
        columns={[
          {
            title: "#",
            width: 70,
            align: "center",
            render: (_, record: any, i) => (
              <Text strong type="secondary">
                {record?.rank}
              </Text>
            ),
          },
          {
            title: "Player",
            render: (_, r) => {
              const p = getPlayer(r.playerId);
              return (
                <Space>
                  <Avatar src={p?.profilePictureUrl} />
                  <Text strong>{p?.name}</Text>
                  {p?.nickname && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      "{p.nickname}"
                    </Text>
                  )}
                </Space>
              );
            },
          },
          {
            title: "Stat",
            align: "right",
            render: (_, r) => (
              <Tag color="blue" style={{ borderRadius: 4, fontWeight: "bold" }}>
                {value(r).toFixed(2)} {unit || ""}
              </Tag>
            ),
          },
        ]}
      />
    </Drawer>
  );
}
