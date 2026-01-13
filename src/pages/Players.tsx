// import { Button, Table, Avatar, Space } from "antd";
// import { collection, getDocs } from "firebase/firestore";
// import { useEffect, useState } from "react";
// import { db } from "../firebase";
// import { useNavigate } from "react-router-dom";
// import type { Player } from "../types/Player";
// import type { ColumnsType } from "antd/es/table";
// import dayjs from "dayjs";

// export default function Players() {
//   const [players, setPlayers] = useState<Player[]>([]);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const getPlayers = () => {
//       setLoading(true);
//       getDocs(collection(db, "players")).then((snapshot) => {
//         setPlayers(
//           snapshot.docs.map((d) => ({
//             id: d.id,
//             ...(d.data() as Omit<Player, "id">),
//           }))
//         );
//         setLoading(false);
//       });
//     };
//     getPlayers();
//   }, []);

//   const columns: ColumnsType<Player> = [
//     /* 📱 Mobile summary column */ {
//       title: "",
//       dataIndex: "profilePictureUrl",
//       key: "avatar",
//       width: 64,
//       render: (_, record) => (
//         <Avatar src={record.profilePictureUrl} alt={record.name}>
//           {!record.profilePictureUrl &&
//             record.name
//               .split(" ")
//               .map((n) => n[0])
//               .join("")
//               .toUpperCase()}
//         </Avatar>
//       ),
//     },
//     {
//       title: "Player",
//       key: "mobile",
//       responsive: ["xs"],
//       render: (_, player) => (
//         <Space direction="vertical" size={0}>
//           <strong>{player.name}</strong>
//           {player.nickname && <span>“{player.nickname}”</span>}
//           {player.usualPosition && <span>{player.usualPosition}</span>}
//         </Space>
//       ),
//     },

//     /* 🖥 Desktop columns */
//     {
//       title: "Name",
//       dataIndex: "name",
//       responsive: ["sm"],
//     },
//     {
//       title: "Nickname",
//       dataIndex: "nickname",
//       responsive: ["md"],
//     },
//     {
//       title: "Position",
//       dataIndex: "usualPosition",
//       responsive: ["md"],
//     },
//     {
//       title: "Birthday",
//       dataIndex: "birthday",
//       responsive: ["lg"],
//       render: (birthday?: any) =>
//         birthday ? dayjs(birthday.toDate()).format("DD MMM YYYY") : "-",
//     },
//     {
//       title: "Bio",
//       dataIndex: "bio",
//       responsive: ["xl"],
//       ellipsis: true,
//     },
//     {
//       title: "Created",
//       dataIndex: "createdAt",
//       responsive: ["xl"],
//       render: (date) => dayjs(date.toDate()).fromNow(),
//     },
//   ];

//   return (
//     <>
//       <Button
//         type="primary"
//         onClick={() => navigate("/players/new")}
//         style={{ marginBottom: 16 }}
//       >
//         Add Player
//       </Button>

//       <Table<Player>
//         loading={loading}
//         rowKey="id"
//         dataSource={players}
//         columns={columns}
//         pagination={{ pageSize: 10 }}
//       />
//     </>
//   );
// }

import {
  Button,
  Avatar,
  Space,
  Card,
  Tag,
  Typography,
  Row,
  Col,
  Skeleton,
  Empty,
} from "antd";
import {
  PlusOutlined,
  UserOutlined,
  CalendarOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import type { Player } from "../types/Player";
import dayjs from "dayjs";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../auth/AuthContext";

const { Title, Text } = Typography;

export default function Players() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user = useAuth();
  useEffect(() => {
    const getPlayers = async () => {
      try {
        setLoading(true);
        const snapshot = await getDocs(collection(db, "players"));
        setPlayers(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Player, "id">),
          }))
        );
      } finally {
        setLoading(false);
      }
    };
    getPlayers();
  }, []);

  // Animation variants for the grid items
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVars = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <div style={{ padding: "20px 0" }}>
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Squad Roster
          </Title>
          <Text type="secondary">
            Manage these dudes who claim to be footballers
          </Text>
        </div>
        {user && (
          <Button
            type="primary"
            shape="round"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => navigate("/players/new")}
            style={{
              background: "#1890ff",
              boxShadow: "0 4px 10px rgba(24, 144, 255, 0.3)",
            }}
          >
            Add Player
          </Button>
        )}
      </div>

      {loading ? (
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4].map((i) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={i}>
              <Card loading={true} />
            </Col>
          ))}
        </Row>
      ) : players.length === 0 ? (
        <Empty description="No players found. Time to recruit!" />
      ) : (
        <motion.div variants={containerVars} initial="hidden" animate="show">
          <Row gutter={[16, 16]}>
            <AnimatePresence>
              {players
                ?.filter((player) => !player.name.includes("placeholder"))
                .map((player) => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={player.id}>
                    <motion.div
                      variants={itemVars}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Card
                        hoverable
                        style={{
                          borderRadius: 12,
                          overflow: "hidden",
                          border: "1px solid #f0f0f0",
                        }}
                        bodyStyle={{ padding: "20px" }}
                      >
                        <div style={{ textAlign: "center", marginBottom: 16 }}>
                          <Avatar
                            size={84}
                            src={player.profilePictureUrl || "#"}
                            icon={<UserOutlined />}
                            style={{
                              border: "4px solid #1890ff",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            }}
                          />
                          <Title
                            level={4}
                            style={{ marginTop: 12, marginBottom: 4 }}
                          >
                            {player.name}
                          </Title>
                          {player.nickname && (
                            <Text type="secondary" italic>
                              "{player.nickname}"
                            </Text>
                          )}
                        </div>

                        <Space direction="vertical" style={{ width: "100%" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Text type="secondary">
                              <GlobalOutlined /> Position
                            </Text>
                            <Tag color="blue" style={{ margin: 0 }}>
                              {player.usualPosition || "N/A"}
                            </Tag>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Text type="secondary">
                              <CalendarOutlined /> Joined
                            </Text>
                            <Text strong>
                              {player.createdAt
                                ? dayjs(player.createdAt.toDate()).format(
                                    "MMM YYYY"
                                  )
                                : "N/A"}
                            </Text>
                          </div>

                          {player.bio && (
                            <div
                              style={{
                                marginTop: 8,
                                paddingTop: 8,
                                borderTop: "1px solid #f0f0f0",
                              }}
                            >
                              <Text
                                type="secondary"
                                ellipsis={{ tooltip: player.bio }}
                              >
                                {player.bio}
                              </Text>
                            </div>
                          )}

                          {user && (
                            <Button
                              block
                              style={{ marginTop: 12, borderRadius: 6 }}
                              onClick={() =>
                                navigate(`/players/edit/${player.id}`)
                              }
                            >
                              Edit Profile
                            </Button>
                          )}
                        </Space>
                      </Card>
                    </motion.div>
                  </Col>
                ))}
            </AnimatePresence>
          </Row>
        </motion.div>
      )}
    </div>
  );
}
