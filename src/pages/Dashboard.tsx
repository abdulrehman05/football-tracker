// import { Card, Col, Row, Select, Spin, Typography } from "antd";
// import { useEffect, useMemo, useState } from "react";
// import { collection, getDocs } from "firebase/firestore";
// import { db } from "../firebase";
// import type { Match } from "../types/match";
// import type { Player } from "../types/Player";
// import type { CustomStat } from "../types/CustomStat";
// import StatCard from "../components/StatCard";
// import RankingDrawer from "../components/RankingDrawer";
// import {
//   aggregateMatches,
//   avgRating,
//   consistency,
//   rankPlayers,
//   resolveDateRange,
//   winPct,
//   type RangeKey,
// } from "../utils/dashboard";
// import {
//   dashboardStats,
//   customStatToDashboardStat,
// } from "../utils/dashboardStats";
// // import {
// //   BarChart,
// //   Bar,
// //   XAxis,
// //   YAxis,
// //   Tooltip,
// //   ResponsiveContainer,
// //   PieChart,
// //   Pie,
// //   Cell,
// // } from "recharts";

// export default function Dashboard() {
//   const [range, setRange] = useState<RangeKey>("thisMonth");
//   const [matches, setMatches] = useState<Match[]>([]);
//   const [players, setPlayers] = useState<Player[]>([]);
//   const [customStats, setCustomStats] = useState<CustomStat[]>([]);
//   const [drawer, setDrawer] = useState<any>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const load = async () => {
//       setLoading(true);
//       const [m, p, c] = await Promise.all([
//         getDocs(collection(db, "matches")),
//         getDocs(collection(db, "players")),
//         getDocs(collection(db, "customStats")),
//       ]);

//       setMatches(m.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
//       setPlayers(p.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
//       setCustomStats(c.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
//       setLoading(false);
//     };
//     load();
//   }, []);

//   const filteredMatches = useMemo(() => {
//     const [start, end] = resolveDateRange(range);
//     if (!start || !end) return matches;

//     return matches.filter((m) => {
//       const d = m.date.toDate();
//       return d >= start.toDate() && d <= end.toDate();
//     });
//   }, [matches, range]);

//   const aggregated = useMemo(
//     () => Object.values(aggregateMatches(filteredMatches, customStats)),
//     [filteredMatches, customStats]
//   );

//   const allDashboardStats = useMemo(() => {
//     return [...dashboardStats, ...customStats.map(customStatToDashboardStat)];
//   }, [customStats]);
//   if (loading) return <Spin />;

//   return (
//     <>
//       <Typography.Title>Dashboard</Typography.Title>

//       <Select
//         value={range}
//         onChange={setRange}
//         style={{ width: 220, marginBottom: 24 }}
//         options={[
//           { value: "thisMonth", label: "This Month" },
//           { value: "previousMonth", label: "Previous Month" },
//           { value: "past6Months", label: "Past 6 Months" },
//           { value: "semester3", label: "Semester 3" },
//           { value: "allTime", label: "All Time" },
//         ]}
//       />
//       <Row gutter={[16, 16]}>
//         {allDashboardStats.map((stat) => {
//           const ranking = rankPlayers(aggregated, stat.value, stat.sort);

//           return (
//             <Col key={stat.key} xs={24} md={8}>
//               <StatCard
//                 stat={stat}
//                 title={stat.title}
//                 ranking={ranking}
//                 players={players}
//                 onViewAll={() =>
//                   setDrawer({
//                     title: stat.title,
//                     value: stat.value,
//                     sort: stat.sort,
//                     unit: stat.unit,
//                   })
//                 }
//               />
//             </Col>
//           );
//         })}
//       </Row>
//       {drawer && (
//         <RankingDrawer
//           open
//           title={drawer.title}
//           ranking={rankPlayers(aggregated, drawer.value, drawer.sort)}
//           players={players}
//           value={drawer.value}
//           unit={drawer.unit as any}
//           onClose={() => setDrawer(null)}
//         />
//       )}
//       {/* <Card title="Average Rating">
//         <ResponsiveContainer width="100%" height={300}>
//           <BarChart
//             data={aggregated.map((p) => ({
//               name: players.find((pl) => pl.id === p.playerId)?.name,
//               rating: avgRating(p),
//             }))}
//           >
//             <XAxis dataKey="name" />
//             <YAxis domain={[0, 10]} />
//             <Tooltip />
//             <Bar dataKey="rating" />
//           </BarChart>
//         </ResponsiveContainer>
//       </Card>
//       <Card title="Matches Played Distribution">
//         <ResponsiveContainer width="100%" height={300}>
//           <PieChart>
//             <Pie
//               data={aggregated.map((p) => ({
//                 name: players.find((pl) => pl.id === p.playerId)?.name,
//                 value: p.matches,
//               }))}
//               dataKey="value"
//               nameKey="name"
//               label
//             />
//             <Tooltip />
//           </PieChart>
//         </ResponsiveContainer>
//       </Card> */}
//       {/* <Card title="Top Goal Scorers">
//         <ResponsiveContainer width="100%" height={300}>
//           <BarChart
//             data={rankPlayers(aggregated, (p) => p.totals.goals || 0, "desc")
//               .slice(0, 10)
//               .map((p) => ({
//                 name: players.find((pl) => pl.id === p.playerId)?.name,
//                 goals: p.totals.goals || 0,
//               }))}
//           >
//             <XAxis dataKey="name" />
//             <YAxis />
//             <Tooltip />
//             <Bar dataKey="goals" />
//           </BarChart>
//         </ResponsiveContainer>
//       </Card> */}
//     </>
//   );
// }

import {
  Card,
  Col,
  Row,
  Select,
  Spin,
  Typography,
  Space,
  Empty,
  Flex,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { CalendarOutlined, RocketOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";

import StatCard from "../components/StatCard";
import RankingDrawer from "../components/RankingDrawer";
import {
  aggregateMatches,
  rankPlayers,
  resolveDateRange,
  type RangeKey,
} from "../utils/dashboard";
import {
  dashboardStats,
  customStatToDashboardStat,
} from "../utils/dashboardStats";
import type { Match } from "../types/match";
import type { Player } from "../types/Player";
import type { CustomStat } from "../types/CustomStat";

const { Title, Text } = Typography;

export default function Dashboard() {
  const [range, setRange] = useState<RangeKey>("allTime");
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [customStats, setCustomStats] = useState<CustomStat[]>([]);
  const [drawer, setDrawer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  console.log("dashboard");
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [m, p, c] = await Promise.all([
        getDocs(collection(db, "matches")),
        getDocs(collection(db, "players")),
        getDocs(collection(db, "customStats")),
      ]);
      setMatches(m.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      setPlayers(p.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      setCustomStats(c.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      setLoading(false);
    };
    load();
  }, []);

  const filteredMatches = useMemo(() => {
    const [start, end] = resolveDateRange(range);
    if (!start || !end) return matches;
    return matches.filter((m) => {
      const d = m.date.toDate();
      return d >= start.toDate() && d <= end.toDate();
    });
  }, [matches, range]);

  const aggregated = useMemo(
    () => Object.values(aggregateMatches(filteredMatches, customStats)),
    [filteredMatches, customStats]
  );

  const allDashboardStats = useMemo(() => {
    return [...dashboardStats, ...customStats.map(customStatToDashboardStat)];
  }, [customStats]);

  if (loading)
    return (
      <div
        style={{
          height: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" tip="Calculating stats..." />
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ paddingBottom: 40 }}
    >
      <Flex
        wrap
        justify="space-between"
        align="center"
        style={{ marginBottom: 32 }}
      >
        <Space direction="vertical">
          <Title level={2} style={{ margin: 0 }}>
            Performance Center
          </Title>
          <Text type="secondary">Track everyone's peaks and downfalls.</Text>
        </Space>

        <div
          style={{
            // marginTop: 24,
            background: "white",
            padding: "16px",
            borderRadius: 12,
            display: "inline-block",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <Space>
            <CalendarOutlined style={{ color: "#1890ff" }} />
            <Text strong>Timeframe:</Text>
            <Select
              bordered={false}
              value={range}
              onChange={setRange}
              style={{ width: 180 }}
              options={[
                { value: "thisMonth", label: "This Month" },
                { value: "previousMonth", label: "Previous Month" },
                { value: "past6Months", label: "Past 6 Months" },
                { value: "semester3", label: "Semester 3" },
                { value: "allTime", label: "All Time History" },
              ]}
            />
          </Space>
        </div>
      </Flex>

      {aggregated.length === 0 ? (
        <Empty description="No matches found for this period" />
      ) : (
        <Row gutter={[24, 24]}>
          {allDashboardStats.map((stat, index) => {
            const ranking = rankPlayers(aggregated, stat.value, stat.sort);
            return (
              <Col key={stat.key} xs={24} md={12} xl={8}>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <StatCard
                    stat={stat}
                    title={stat.title}
                    ranking={ranking}
                    players={players}
                    onViewAll={() =>
                      setDrawer({
                        title: stat.title,
                        value: stat.value,
                        sort: stat.sort,
                        unit: stat.unit,
                        additionalVal: stat?.additionalVal
                          ? stat?.additionalVal
                          : undefined,
                      })
                    }
                  />
                </motion.div>
              </Col>
            );
          })}
        </Row>
      )}

      {drawer && (
        <RankingDrawer
          open
          title={drawer.title}
          ranking={rankPlayers(aggregated, drawer.value, drawer.sort)}
          players={players}
          value={drawer.value}
          additionalVal={drawer.additionalVal}
          unit={drawer.unit as any}
          onClose={() => setDrawer(null)}
        />
      )}
    </motion.div>
  );
}
