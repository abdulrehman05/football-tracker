// import {
//   Avatar,
//   Button,
//   Card,
//   DatePicker,
//   Form,
//   Input,
//   InputNumber,
//   Select,
//   Steps,
//   Table,
//   Typography,
//   message,
// } from "antd";
// import { useEffect, useState } from "react";
// import {
//   addDoc,
//   collection,
//   doc,
//   getDoc,
//   getDocs,
//   Timestamp,
//   updateDoc,
// } from "firebase/firestore";
// import { db } from "../firebase";
// import type { Player } from "../types/Player";
// import type { CustomStat } from "../types/CustomStat";
// import type { Match } from "../types/match";
// import type { Team } from "../types/team";
// import {
//   numberStats,
//   stringStats,
//   type MatchPlayer,
// } from "../types/matchplayer";
// import { useNavigate, useParams } from "react-router-dom";
// import dayjs from "dayjs";

// export default function CreateMatch() {
//   const [form] = Form.useForm();
//   const [step, setStep] = useState(0);
//   const [loading, setLoading] = useState(false);

//   const [players, setPlayers] = useState<Player[]>([]);
//   const [customStats, setCustomStats] = useState<CustomStat[]>([]);
//   const { matchId } = useParams<{ matchId?: string }>();
//   const isEdit = Boolean(matchId);
//   const navigate = useNavigate();
//   useEffect(() => {
//     const load = async () => {
//       const pSnap = await getDocs(collection(db, "players"));
//       setPlayers(pSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));

//       const cSnap = await getDocs(collection(db, "customStats"));
//       setCustomStats(
//         cSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
//       );
//     };
//     load();
//   }, []);
//   useEffect(() => {
//     if (!matchId) return;

//     const loadMatch = async () => {
//       const ref = doc(db, "matches", matchId);
//       const snap = await getDoc(ref);

//       if (!snap.exists()) {
//         message.error("Match not found");
//         navigate("/matches");
//         return;
//       }

//       const data = snap.data();
//       console.log({ data });
//       form.setFieldsValue({
//         ...data,
//         date: dayjs(data.date.toDate()),
//       });
//     };

//     loadMatch();
//   }, [matchId, form, navigate]);

//   const submit = async (values: any) => {
//     setLoading(true);

//     try {
//       const payload: Omit<Match, "id"> = {
//         ...values,
//         date: Timestamp.fromDate(values.date.toDate()),
//         createdAt: values.createdAt ?? Timestamp.now(),
//       };

//       if (isEdit && matchId) {
//         await updateDoc(doc(db, "matches", matchId), payload);
//         message.success("Match updated");
//       } else {
//         await addDoc(collection(db, "matches"), {
//           ...payload,
//           createdAt: Timestamp.now(),
//         });
//         message.success("Match created");
//       }

//       navigate("/matches");
//     } catch (e) {
//       console.error(e);
//       message.error("Failed to save match");
//     } finally {
//       setLoading(false);
//     }
//   };
//   const next = async () => {
//     try {
//       await form.validateFields();
//       setStep(step + 1);
//     } catch {
//       message.error("error");
//     }
//   };
//   return (
//     <Card title="Create Match">
//       <Steps
//         current={step}
//         style={{ marginBottom: 24 }}
//         items={[
//           { title: "Teams" },
//           { title: "Match Info" },
//           { title: "Stats" },
//         ]}
//       />

//       <Form
//         form={form}
//         layout="vertical"
//         onFinish={submit}
//         initialValues={{
//           teams: [
//             { id: "A", name: "Team A", players: [] },
//             { id: "B", name: "Team B", players: [] },
//           ],
//           score: { teamA: 0, teamB: 0 },
//         }}
//       >
//         {/* STEP 1 – TEAMS */}
//         <div style={{ display: step === 0 ? "block" : "none" }}>
//           <Form.List name="teams">
//             {(teams) =>
//               teams.map(({ key, name }) => (
//                 <Card key={key} size="small" style={{ marginBottom: 16 }}>
//                   <Form.Item label="Team Name" name={[name, "name"]}>
//                     <Input />
//                   </Form.Item>

//                   <Form.List name={[name, "players"]}>
//                     {(playersList, { add }) => (
//                       <>
//                         {/* <Form.Item label="Team Name" name={[name, "name"]}> */}
//                         <Select
//                           mode="multiple"
//                           style={{ width: "100%" }}
//                           placeholder="Select players"
//                           options={players.map((p) => ({
//                             value: p.id,
//                             label: p.name,
//                           }))}
//                           value={(
//                             form.getFieldValue(["teams", name, "players"]) ?? []
//                           )?.map((val: any) => {
//                             console.log({ [name]: val });
//                             return val?.playerId;
//                           })}
//                           onChange={(ids) => {
//                             const existing =
//                               form.getFieldValue(["teams", name, "players"]) ||
//                               [];

//                             const merged = ids.map((id: string) => {
//                               const found = existing.find(
//                                 (p: MatchPlayer) => p.playerId === id
//                               );
//                               return found ?? { playerId: id };
//                             });

//                             form.setFieldValue(
//                               ["teams", name, "players"],
//                               merged
//                             );
//                           }}
//                         />
//                         {/* </Form.Item> */}
//                       </>
//                     )}
//                   </Form.List>
//                 </Card>
//               ))
//             }
//           </Form.List>
//         </div>

//         {/* STEP 2 – MATCH INFO */}
//         <div style={{ display: step === 1 ? "block" : "none" }}>
//           <Form.Item label="Date" name="date" rules={[{ required: true }]}>
//             <DatePicker />
//           </Form.Item>

//           <Form.Item label="Duration (min)" name="duration">
//             <InputNumber min={0} />
//           </Form.Item>

//           <Form.Item label="Format" name="format">
//             <Select
//               options={["5v5", "7v7", "9v9", "11v11"].map((v) => ({
//                 value: v,
//               }))}
//             />
//           </Form.Item>

//           <Form.Item label="Location" name="location">
//             <Input />
//           </Form.Item>

//           <Typography.Title level={5}>Score</Typography.Title>

//           <Form.Item label="Team A" name={["score", "teamA"]}>
//             <InputNumber min={0} />
//           </Form.Item>

//           <Form.Item label="Team B" name={["score", "teamB"]}>
//             <InputNumber min={0} />
//           </Form.Item>
//         </div>

//         {/* STEP 3 – STATS */}
//         <div style={{ display: step === 2 ? "block" : "none" }}>
//           <Form.Item shouldUpdate>
//             {() => {
//               const teams: Team[] = form.getFieldValue("teams") || [];

//               return teams.map((team, tIdx) => (
//                 <Table
//                   key={team.id}
//                   rowKey="playerId"
//                   pagination={false}
//                   title={() => team.name}
//                   dataSource={team.players}
//                   columns={[
//                     {
//                       title: "Player",
//                       render: (_: any, r: MatchPlayer) => {
//                         const p = players.find((pl) => pl.id === r.playerId);
//                         return (
//                           <>
//                             <Avatar src={p?.profilePictureUrl} /> {p?.name}
//                           </>
//                         );
//                       },
//                     },
//                     ...numberStats.map((stat) => ({
//                       title: stat.toUpperCase(),
//                       render: (_: any, r: MatchPlayer) => (
//                         <InputNumber
//                           min={0}
//                           onChange={(v) =>
//                             form.setFieldValue(
//                               ["teams", tIdx, "players"],
//                               team.players.map((p) =>
//                                 p.playerId === r.playerId
//                                   ? { ...p, [stat]: v }
//                                   : p
//                               )
//                             )
//                           }
//                         />
//                       ),
//                     })),
//                     ...stringStats.map((stat) => ({
//                       title: stat.toUpperCase(),
//                       render: (_: any, r: MatchPlayer) => (
//                         <Input
//                           onChange={(v) =>
//                             form.setFieldValue(
//                               ["teams", tIdx, "players"],
//                               team.players.map((p) =>
//                                 p.playerId === r.playerId
//                                   ? { ...p, [stat]: v }
//                                   : p
//                               )
//                             )
//                           }
//                         />
//                       ),
//                     })),
//                     ...customStats.map((cs) => ({
//                       title: cs.name,
//                       render: (_: any, r: MatchPlayer) => (
//                         <InputNumber
//                           onChange={(v) => {
//                             const updated = team.players.map((p) =>
//                               p.playerId === r.playerId
//                                 ? {
//                                     ...p,
//                                     customStats: [
//                                       ...(p.customStats || []).filter(
//                                         (s) => s.statId !== cs.id
//                                       ),
//                                       { statId: cs.id, value: v ?? 0 },
//                                     ],
//                                   }
//                                 : p
//                             );

//                             form.setFieldValue(
//                               ["teams", tIdx, "players"],
//                               updated
//                             );
//                           }}
//                         />
//                       ),
//                     })),
//                   ]}
//                 />
//               ));
//             }}
//           </Form.Item>
//         </div>

//         {/* NAVIGATION */}
//         <div style={{ marginTop: 24 }}>
//           {step > 0 && <Button onClick={() => setStep(step - 1)}>Back</Button>}
//           {step < 2 && (
//             <Button type="primary" onClick={next}>
//               Next
//             </Button>
//           )}
//           {step === 2 && (
//             <Button type="primary" htmlType="submit" loading={loading}>
//               {isEdit ? "Update Match" : "Create Match"}
//             </Button>
//           )}
//         </div>
//       </Form>
//     </Card>
//   );
// }

import {
  Avatar,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Steps,
  Table,
  Typography,
  message,
  Row,
  Col,
  Space,
  Divider,
  Badge,
} from "antd";
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrophyOutlined,
  TeamOutlined,
  ControlOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  RightOutlined,
  LeftOutlined,
} from "@ant-design/icons";

// Types (ensure these match your definitions)
import type { Player } from "../types/Player";
import type { CustomStat } from "../types/CustomStat";
import type { Match } from "../types/match";
import type { Team } from "../types/team";
import {
  numberStats,
  stringStats,
  toTitle,
  type MatchPlayer,
} from "../types/matchplayer";

const { Title, Text } = Typography;

export default function CreateMatch() {
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [updatev, setUpdate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [customStats, setCustomStats] = useState<CustomStat[]>([]);
  const { matchId } = useParams<{ matchId?: string }>();
  const isEdit = Boolean(matchId);
  const navigate = useNavigate();
  const update = () => {
    setUpdate(!updatev);
  };
  useEffect(() => {
    const loadData = async () => {
      const [pSnap, cSnap] = await Promise.all([
        getDocs(collection(db, "players")),
        getDocs(collection(db, "customStats")),
      ]);
      setPlayers(pSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      setCustomStats(
        cSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
      );
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!matchId) return;
    const loadMatch = async () => {
      const snap = await getDoc(doc(db, "matches", matchId));
      if (snap.exists()) {
        const data = snap.data();
        form.setFieldsValue({ ...data, date: dayjs(data.date.toDate()) });
      }
    };
    loadMatch();
  }, [matchId, form]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const teams = form.getFieldValue("teams");
      const payload = {
        ...values,
        teams: teams,
        date: Timestamp.fromDate(values.date.toDate()),
        updatedAt: Timestamp.now(),
      };
      console.log({ payload, values, teams });
      if (isEdit) {
        await updateDoc(doc(db, "matches", matchId!), payload);
        message.success("Match updated!");
      } else {
        await addDoc(collection(db, "matches"), {
          ...payload,
          createdAt: Timestamp.now(),
        });
        message.success("Match result recorded!");
      }
      navigate("/matches");
    } catch (e) {
      message.error("Failed to save match: " + e);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const next = async (e) => {
    try {
      e.preventDefault();
      await form.validateFields();
      setStep(step + 1);
    } catch (e) {
      message.error("Please fill in the required fields");
    }
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      <Title level={2}>{isEdit ? "Edit Match" : "Record Match"}</Title>

      <Steps
        current={step}
        style={{ marginBottom: 32 }}
        items={[
          { title: "Teams", icon: <TeamOutlined /> },
          { title: "Info", icon: <ControlOutlined /> },
          { title: "Stats", icon: <TrophyOutlined /> },
        ]}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          teams: [
            { id: "A", name: "Team A", players: [] },
            { id: "B", name: "Team B", players: [] },
          ],
          score: { teamA: 0, teamB: 0 },
          date: dayjs(),
        }}
      >
        <AnimatePresence mode="wait">
          {/* STEP 1: TEAM SELECTION */}
          {
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ display: step !== 0 ? "none" : undefined }}
            >
              <Form.List name="teams">
                {(teams) => (
                  <Row gutter={[16, 16]}>
                    {teams.map(({ key, name, ...rest }) => {
                      console.log({ key });
                      return (
                        <Col xs={24} md={12} key={key}>
                          <Card
                            title={
                              <Space>
                                <TeamOutlined />{" "}
                                {form.getFieldValue(["teams", name, "name"])}
                              </Space>
                            }
                            bordered={false}
                            className="shadow-sm"
                          >
                            <Form.Item label="Team Name" name={[name, "name"]}>
                              <Input placeholder="Enter team name" />
                            </Form.Item>

                            <Form.Item label="Select Players" required>
                              <Select
                                mode="multiple"
                                placeholder="Who played?"
                                showSearch={{ optionFilterProp: "label" }}
                                options={players.map((p) => ({
                                  value: p.id,
                                  label: p.name,
                                }))}
                                value={form
                                  .getFieldValue(["teams", name, "players"])
                                  ?.map((p: any) => p.playerId)}
                                onChange={(ids) => {
                                  const existing =
                                    form.getFieldValue([
                                      "teams",
                                      name,
                                      "players",
                                    ]) || [];
                                  const merged = ids.map(
                                    (id: string) =>
                                      existing.find(
                                        (p: any) => p.playerId === id
                                      ) || { playerId: id }
                                  );
                                  console.log({ merged });
                                  form.setFieldValue(
                                    ["teams", name, "players"],
                                    merged
                                  );
                                  update();
                                }}
                              />
                            </Form.Item>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                )}
              </Form.List>
            </motion.div>
          }

          {/* STEP 2: MATCH DETAILS */}
          {
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ display: step !== 1 ? "none" : undefined }}
            >
              <Card bordered={false} className="shadow-sm">
                <Row gutter={24}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Match Date"
                      name="date"
                      rules={[{ required: true }]}
                    >
                      <DatePicker style={{ width: "100%" }} size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Location" name="location">
                      <Input placeholder="Stadium / Pitch name" size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={12}>
                    <Form.Item label="Format" name="format">
                      <Select
                        options={["5v5", "7v7", "9v9", "11v11"].map((v) => ({
                          value: v,
                        }))}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={12}>
                    <Form.Item label="Duration (mins)" name="duration">
                      <InputNumber style={{ width: "100%" }} size="large" />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider>Final Score</Divider>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 32,
                  }}
                >
                  <Form.Item
                    label={form.getFieldValue(["teams", 0, "name"])}
                    name={["score", "teamA"]}
                  >
                    <InputNumber min={0} size="large" />
                  </Form.Item>
                  <Title level={2}>-</Title>
                  <Form.Item
                    label={form.getFieldValue(["teams", 1, "name"])}
                    name={["score", "teamB"]}
                  >
                    <InputNumber min={0} size="large" />
                  </Form.Item>
                </div>
              </Card>
            </motion.div>
          }

          {/* STEP 3: STATS TABLE */}
          {
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ display: step !== 2 ? "none" : undefined }}
            >
              <Form.Item shouldUpdate>
                {() => (
                  <Space
                    direction="vertical"
                    style={{ width: "100%" }}
                    size={24}
                  >
                    {form
                      .getFieldValue("teams")
                      .map((team: Team, tIdx: number) => {
                        console.log({ team });
                        return (
                          <Card
                            key={team.id}
                            title={`${team.name} Performance`}
                            bodyStyle={{ padding: 0 }}
                            overflow-x="auto"
                          >
                            <Table
                              dataSource={team.players}
                              rowKey="playerId"
                              pagination={false}
                              size="small"
                              scroll={{ x: 800 }}
                              columns={[
                                {
                                  title: "Player",
                                  fixed: "left",
                                  width: 200,
                                  render: (_, r) => {
                                    const p = players.find(
                                      (pl) => pl.id === r.playerId
                                    );
                                    return (
                                      <Space>
                                        <Avatar
                                          src={p?.profilePictureUrl || "#"}
                                          size="small"
                                        />
                                        {p?.name}
                                      </Space>
                                    );
                                  },
                                },
                                ...numberStats.map((stat) => ({
                                  title: toTitle(stat),
                                  width: 150,
                                  render: (_, r: MatchPlayer) => (
                                    <InputNumber
                                      min={0}
                                      value={
                                        r[stat as keyof MatchPlayer] as number
                                      }
                                      onChange={(v) => {
                                        const teams = [
                                          ...form.getFieldValue("teams"),
                                        ];
                                        teams[tIdx].players = teams[
                                          tIdx
                                        ].players.map((p: any) =>
                                          p.playerId === r.playerId
                                            ? { ...p, [stat]: v }
                                            : p
                                        );
                                        form.setFieldValue("teams", teams);
                                      }}
                                    />
                                  ),
                                })),
                                ...customStats.map((cs) => ({
                                  // title: cs.name,
                                  title: toTitle(cs.name),
                                  width: 150,
                                  render: (_, r: MatchPlayer) => (
                                    <InputNumber
                                      value={
                                        r.customStats?.find(
                                          (s) => s.statId === cs.id
                                        )?.value
                                      }
                                      onChange={(v) => {
                                        const teams = [
                                          ...form.getFieldValue("teams"),
                                        ];
                                        teams[tIdx].players = teams[
                                          tIdx
                                        ].players.map((p: any) => {
                                          if (p.playerId !== r.playerId)
                                            return p;
                                          const cStats = [
                                            ...(p.customStats || []),
                                          ].filter((s) => s.statId !== cs.id);
                                          return {
                                            ...p,
                                            customStats: [
                                              ...cStats,
                                              { statId: cs.id, value: v ?? 0 },
                                            ],
                                          };
                                        });
                                        form.setFieldValue("teams", teams);
                                      }}
                                    />
                                  ),
                                })),
                              ]}
                            />
                          </Card>
                        );
                      })}
                  </Space>
                )}
              </Form.Item>
            </motion.div>
          }
        </AnimatePresence>

        {/* FLOATING ACTION BAR */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "white",
            padding: "16px 24px",
            boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
            display: "flex",
            justifyContent: "space-between",
            zIndex: 100,
          }}
        >
          <Button
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
            icon={<ArrowLeftOutlined />}
          >
            Back
          </Button>
          {/* <Button
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
            icon={<LeftOutlined />}
            size="large"
          >
            Back
          </Button> */}

          {step < 2 ? (
            <Button
              type="primary"
              onClick={next}
              icon={<ArrowRightOutlined />}
              size="large"
            >
              Continue
            </Button>
          ) : (
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<CheckCircleOutlined />}
              size="large"
              style={{ background: "#52c41a", borderColor: "#52c41a" }}
            >
              {isEdit ? "Update Match Report" : "Save Final Result"}
            </Button>
          )}
        </div>
      </Form>
    </div>
  );
}
