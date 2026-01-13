// import { Button, Space, Table, Tag } from "antd";
// import { collection, getDocs } from "firebase/firestore";
// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { db } from "../firebase";
// import dayjs from "dayjs";
// import type { Match } from "../types/match";
// import MatchDetailsDrawer from "../components/MatchDetailsDrawer";
// import type { Player } from "../types/Player";
// import type { CustomStat } from "../types/CustomStat";

// export default function Matches() {
//   const [matches, setMatches] = useState<Match[]>([]);
//   const [players, setPlayers] = useState<Player[]>([]);
//   const [customStats, setCustomStats] = useState<CustomStat[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchMatches = async () => {
//       setLoading(true);
//       const [snap, pSnap, cSnap] = await Promise.all([
//         getDocs(collection(db, "matches")),
//         getDocs(collection(db, "players")),
//         getDocs(collection(db, "customStats")),
//       ]);

//       setPlayers(pSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
//       setCustomStats(
//         cSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
//       );
//       setMatches(
//         snap.docs.map((d) => ({
//           id: d.id,
//           ...(d.data() as Omit<Match, "id">),
//         }))
//       );
//       setLoading(false);
//     };

//     fetchMatches();
//   }, []);

//   //   useEffect(() => {
//   //     if (!match) return;

//   //     const load = async () => {};

//   //     load();
//   //   }, [match]);
//   return (
//     <>
//       <Button
//         type="primary"
//         onClick={() => navigate("/matches/new")}
//         style={{ marginBottom: 16 }}
//       >
//         Create Match
//       </Button>

//       <Table
//         loading={loading}
//         rowKey="id"
//         dataSource={matches}
//         pagination={{ pageSize: 10 }}
//         scroll={{ x: true }}
//         columns={[
//           {
//             title: "Date",
//             dataIndex: "date",
//             render: (d) => dayjs(d.toDate()).format("DD MMM YYYY"),
//           },
//           {
//             title: "Score",
//             render: (_, r) => `${r.score.teamA} - ${r.score.teamB}`,
//           },
//           {
//             title: "Format",
//             dataIndex: "format",
//             render: (f) => (f ? <Tag>{f}</Tag> : "—"),
//           },
//           {
//             title: "Location",
//             dataIndex: "location",
//             responsive: ["md"],
//           },
//           {
//             title: "Actions",
//             key: "actions",
//             render: (_, record) => (
//               <Space>
//                 <Button size="small" onClick={() => setSelectedMatch(record)}>
//                   View
//                 </Button>

//                 <Button
//                   size="small"
//                   type="link"
//                   onClick={() => navigate(`/matches/edit/${record.id}`)}
//                 >
//                   Edit
//                 </Button>
//               </Space>
//             ),
//           },
//         ]}
//       />

//       {/* VIEW DRAWER */}
//       <MatchDetailsDrawer
//         match={selectedMatch}
//         players={players}
//         customStats={customStats}
//         onClose={() => setSelectedMatch(null)}
//       />
//     </>
//   );
// }

// import {
//   Button,
//   Card,
//   Tag,
//   Typography,
//   Row,
//   Col,
//   Empty,
//   Badge,
//   Space,
//   Tooltip,
// } from "antd";
// import {
//   PlusOutlined,
//   EnvironmentOutlined,
//   CalendarOutlined,
//   EyeOutlined,
//   EditOutlined,
//   TrophyOutlined,
// } from "@ant-design/icons";
// import { collection, getDocs } from "firebase/firestore";
// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { db } from "../firebase";
// import dayjs from "dayjs";
// import type { Match } from "../types/match";
// import type { Player } from "../types/Player";
// import type { CustomStat } from "../types/CustomStat";
// import MatchDetailsDrawer from "../components/MatchDetailsDrawer";
// import { motion } from "framer-motion";

// const { Title, Text } = Typography;

// export default function Matches() {
//   const [matches, setMatches] = useState<Match[]>([]);
//   const [players, setPlayers] = useState<Player[]>([]);
//   const [customStats, setCustomStats] = useState<CustomStat[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchMatches = async () => {
//       setLoading(true);
//       try {
//         const [snap, pSnap, cSnap] = await Promise.all([
//           getDocs(collection(db, "matches")),
//           getDocs(collection(db, "players")),
//           getDocs(collection(db, "customStats")),
//         ]);

//         setPlayers(pSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
//         setCustomStats(
//           cSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
//         );

//         const sortedMatches = snap.docs
//           .map((d) => ({ id: d.id, ...(d.data() as Omit<Match, "id">) }))
//           .sort((a, b) => b.date.toMillis() - a.date.toMillis());

//         setMatches(sortedMatches);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchMatches();
//   }, []);

//   return (
//     <div style={{ padding: "20px 0" }}>
//       {/* Header Section */}
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           marginBottom: 32,
//         }}
//       >
//         <div>
//           <Title level={2} style={{ margin: 0 }}>
//             Match History
//           </Title>
//           <Text type="secondary">
//             Track results and performance of every game
//           </Text>
//         </div>
//         <Button
//           type="primary"
//           icon={<PlusOutlined />}
//           size="large"
//           shape="round"
//           onClick={() => navigate("/matches/new")}
//           style={{ boxShadow: "0 4px 14px rgba(24, 144, 255, 0.3)" }}
//         >
//           New Match
//         </Button>
//       </div>

//       {loading ? (
//         <Card loading={true} />
//       ) : matches.length === 0 ? (
//         <Empty description="No matches recorded yet. Let's play!" />
//       ) : (
//         <Row gutter={[16, 16]}>
//           {matches.map((match) => (
//             <Col xs={24} key={match.id}>
//               <motion.div
//                 whileHover={{ y: -4 }}
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//               >
//                 <Card
//                   bordered={false}
//                   className="match-card"
//                   style={{
//                     borderRadius: 12,
//                     boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
//                   }}
//                   bodyStyle={{ padding: "16px 24px" }}
//                 >
//                   <Row align="middle" gutter={24}>
//                     {/* Date & Format */}
//                     <Col xs={24} md={5}>
//                       <Space direction="vertical" size={0}>
//                         <Text strong style={{ fontSize: "1rem" }}>
//                           {dayjs(match.date.toDate()).format("DD MMM YYYY")}
//                         </Text>
//                         <Text type="secondary" size="small">
//                           <CalendarOutlined />{" "}
//                           {dayjs(match.date.toDate()).format("dddd")}
//                         </Text>
//                         <Tag color="default" style={{ marginTop: 8 }}>
//                           {match.format || "5-a-side"}
//                         </Tag>
//                       </Space>
//                     </Col>

//                     {/* Scoreboard Section */}
//                     <Col
//                       xs={24}
//                       md={10}
//                       style={{ textAlign: "center", padding: "16px 0" }}
//                     >
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           justifyContent: "center",
//                           gap: "24px",
//                           background: "#f5f5f5",
//                           padding: "12px 24px",
//                           borderRadius: "12px",
//                         }}
//                       >
//                         <div style={{ textAlign: "center" }}>
//                           <Text
//                             type="secondary"
//                             strong
//                             style={{
//                               display: "block",
//                               textTransform: "uppercase",
//                             }}
//                           >
//                             {match.teams?.[0]?.name}
//                           </Text>
//                           <Title level={2} style={{ margin: 0 }}>
//                             {match.score.teamA}
//                           </Title>
//                         </div>

//                         <div
//                           style={{
//                             fontSize: "20px",
//                             fontWeight: "bold",
//                             color: "#bfbfbf",
//                           }}
//                         >
//                           VS
//                         </div>

//                         <div style={{ textAlign: "center" }}>
//                           <Text
//                             type="secondary"
//                             strong
//                             style={{
//                               display: "block",
//                               textTransform: "uppercase",
//                             }}
//                           >
//                             {match.teams?.[1]?.name}
//                           </Text>
//                           <Title level={2} style={{ margin: 0 }}>
//                             {match.score.teamB}
//                           </Title>
//                         </div>
//                       </div>
//                     </Col>

//                     {/* Venue & Location */}
//                     <Col xs={24} md={5}>
//                       <Space direction="vertical" size={0}>
//                         <Text type="secondary">
//                           <EnvironmentOutlined /> Location
//                         </Text>
//                         <Text strong style={{ display: "block" }}>
//                           {match.location || "Main Campus Pitch"}
//                         </Text>
//                       </Space>
//                     </Col>

//                     {/* Actions */}
//                     <Col xs={24} md={4} style={{ textAlign: "right" }}>
//                       <Space>
//                         <Tooltip title="View Stats">
//                           <Button
//                             shape="circle"
//                             icon={<EyeOutlined />}
//                             onClick={() => setSelectedMatch(match)}
//                           />
//                         </Tooltip>
//                         <Tooltip title="Edit Match">
//                           <Button
//                             shape="circle"
//                             type="primary"
//                             ghost
//                             icon={<EditOutlined />}
//                             onClick={() =>
//                               navigate(`/matches/edit/${match.id}`)
//                             }
//                           />
//                         </Tooltip>
//                       </Space>
//                     </Col>
//                   </Row>
//                 </Card>
//               </motion.div>
//             </Col>
//           ))}
//         </Row>
//       )}

//       {/* VIEW DRAWER */}
//       <MatchDetailsDrawer
//         match={selectedMatch}
//         players={players}
//         customStats={customStats}
//         onClose={() => setSelectedMatch(null)}
//       />

//       <style>{`
//         .match-card:hover {
//           border-left: 5px solid #1890ff;
//           transition: all 0.2s ease;
//         }
//         @media (max-width: 768px) {
//           .match-card { text-align: center; }
//         }
//       `}</style>
//     </div>
//   );
// }

import {
  Button,
  Card,
  Tag,
  Typography,
  Row,
  Col,
  Empty,
  Space,
  Tooltip,
  DatePicker,
  Pagination,
  Flex,
} from "antd";
import {
  PlusOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  EyeOutlined,
  EditOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import type { Match } from "../types/match";
import type { Player } from "../types/Player";
import type { CustomStat } from "../types/CustomStat";
import MatchDetailsDrawer from "../components/MatchDetailsDrawer";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../auth/AuthContext";

dayjs.extend(isBetween);
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function Matches() {
  const [allMatches, setAllMatches] = useState<Match[]>([]); // Store original data
  const [players, setPlayers] = useState<Player[]>([]);
  const [customStats, setCustomStats] = useState<CustomStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const user = useAuth();
  // Pagination & Filtering State
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );
  const pageSize = 15;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const [snap, pSnap, cSnap] = await Promise.all([
          getDocs(collection(db, "matches")),
          getDocs(collection(db, "players")),
          getDocs(collection(db, "customStats")),
        ]);

        setPlayers(pSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
        setCustomStats(
          cSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        );

        const sortedMatches = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Match, "id">) }))
          .sort((a, b) => b.date.toMillis() - a.date.toMillis());

        setAllMatches(sortedMatches);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  // Filter Logic
  const filteredMatches = useMemo(() => {
    if (!dateRange) return allMatches;
    const [start, end] = dateRange;
    return allMatches.filter((m) => {
      const matchDate = dayjs(m.date.toDate());
      return matchDate.isBetween(start, end, "day", "[]");
    });
  }, [allMatches, dateRange]);

  // Pagination Logic
  const paginatedMatches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMatches.slice(start, start + pageSize);
  }, [filteredMatches, currentPage]);

  return (
    <div style={{ padding: "20px 0" }}>
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 32,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Match History
          </Title>
          <Text type="secondary">
            Track results and performance of every game ever
          </Text>
        </div>
        {user && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            shape="round"
            onClick={() => navigate("/matches/new")}
            style={{ boxShadow: "0 4px 14px rgba(24, 144, 255, 0.3)" }}
          >
            New Match
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
        bodyStyle={{ padding: "12px 24px" }}
      >
        <Space wrap>
          <FilterOutlined style={{ color: "#1890ff" }} />
          <Text strong>Filter by Date:</Text>
          <RangePicker
            onChange={(values) => {
              setDateRange(values as [dayjs.Dayjs, dayjs.Dayjs]);
              setCurrentPage(1); // Reset to page 1 on filter
            }}
            style={{ borderRadius: 6 }}
          />
          {dateRange && (
            <Button type="link" onClick={() => setDateRange(null)}>
              Clear
            </Button>
          )}
        </Space>
      </Card>

      {loading ? (
        <Card loading={true} style={{ borderRadius: 12 }} />
      ) : filteredMatches.length === 0 ? (
        <Empty description="No matches found for this period." />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <AnimatePresence mode="popLayout">
              {paginatedMatches.map((match, index) => (
                <Col xs={24} key={match.id}>
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      bordered={false}
                      className="match-card"
                      style={{
                        borderRadius: 12,
                        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                      }}
                      bodyStyle={{ padding: "16px 24px" }}
                    >
                      <Row align="middle" gutter={24}>
                        <Col xs={24} md={5}>
                          <Space direction="vertical" size={0}>
                            <Text strong style={{ fontSize: "1rem" }}>
                              {dayjs(match.date.toDate()).format("DD MMM YYYY")}
                            </Text>
                            <Text type="secondary" size="small">
                              <CalendarOutlined />{" "}
                              {dayjs(match.date.toDate()).format("dddd")}
                            </Text>
                            <Tag
                              color="blue"
                              style={{ marginTop: 8, borderRadius: 4 }}
                            >
                              {match.format || "5-a-side"}
                            </Tag>
                          </Space>
                        </Col>

                        <Col
                          xs={24}
                          md={10}
                          style={{ textAlign: "center", padding: "16px 0" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "24px",
                              background: "#f8f9fa",
                              padding: "12px 24px",
                              borderRadius: "12px",
                            }}
                          >
                            <div style={{ textAlign: "center", minWidth: 80 }}>
                              <Text
                                type="secondary"
                                strong
                                style={{ display: "block", fontSize: "10px" }}
                              >
                                {match.teams?.[0]?.name || "TEAM A"}
                              </Text>
                              <Title level={2} style={{ margin: 0 }}>
                                {match.score.teamA}
                              </Title>
                            </div>
                            <div
                              style={{
                                fontSize: "18px",
                                fontWeight: "900",
                                color: "#d9d9d9",
                              }}
                            >
                              —
                            </div>
                            <div style={{ textAlign: "center", minWidth: 80 }}>
                              <Text
                                type="secondary"
                                strong
                                style={{ display: "block", fontSize: "10px" }}
                              >
                                {match.teams?.[1]?.name || "TEAM B"}
                              </Text>
                              <Title level={2} style={{ margin: 0 }}>
                                {match.score.teamB}
                              </Title>
                            </div>
                          </div>
                        </Col>

                        <Col xs={24} md={5}>
                          <Space direction="vertical" size={0}>
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              <EnvironmentOutlined /> Location
                            </Text>
                            <Text strong>{match.location || "Pitch 1"}</Text>
                          </Space>
                        </Col>

                        <Col xs={24} md={4} style={{ textAlign: "right" }}>
                          <Space>
                            <Tooltip title="View Stats">
                              <Button
                                shape="circle"
                                icon={<EyeOutlined />}
                                onClick={() => setSelectedMatch(match)}
                              />
                            </Tooltip>
                            {user && (
                              <Tooltip title="Edit Match">
                                <Button
                                  shape="circle"
                                  type="primary"
                                  ghost
                                  icon={<EditOutlined />}
                                  onClick={() =>
                                    navigate(`/matches/edit/${match.id}`)
                                  }
                                />
                              </Tooltip>
                            )}
                          </Space>
                        </Col>
                      </Row>
                    </Card>
                  </motion.div>
                </Col>
              ))}
            </AnimatePresence>
          </Row>

          {/* Pagination Footer */}
          <Flex
            style={{ marginTop: 32, textAlign: "center" }}
            align="center"
            justify="center"
          >
            <Pagination
              current={currentPage}
              total={filteredMatches.length}
              pageSize={pageSize}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
            />
          </Flex>
        </>
      )}

      <MatchDetailsDrawer
        match={selectedMatch}
        players={players}
        customStats={customStats}
        onClose={() => setSelectedMatch(null)}
      />

      <style>{`
        .match-card:hover {
          border-left: 5px solid #1890ff;
          transform: translateX(4px);
          transition: all 0.3s ease;
        }
        @media (max-width: 768px) {
          .match-card { text-align: center; }
        }
      `}</style>
    </div>
  );
}
