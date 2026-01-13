// import { Button, Card, DatePicker, Form, Input, Select, message } from "antd";
// import { addDoc, collection, Timestamp } from "firebase/firestore";
// import { db } from "../firebase";
// import { useNavigate } from "react-router-dom";
// import type { Player } from "../types/Player";
// import type dayjs from "dayjs";
// import ImageUploader from "../components/ImageUploader";
// import { useState } from "react";

// type CreatePlayerFormValues = {
//   name: string;
//   nickname?: string;
//   birthday?: dayjs.Dayjs;
//   profilePictureUrl?: string;
//   bio?: string;
//   usualPosition?: Player["usualPosition"];
// };

// export default function CreatePlayer() {
//   const navigate = useNavigate();

//   const [loading, setLoading] = useState(true);
//   const onFinish = async (values: CreatePlayerFormValues) => {
//     const playerData: Omit<Player, "id"> = {
//       name: values.name,
//       ...(values?.nickname ? { nickname: values?.nickname } : {}),
//       birthday: values.birthday
//         ? Timestamp.fromDate(values.birthday.toDate())
//         : undefined,
//       ...(values?.profilePictureUrl
//         ? { profilePictureUrl: values?.profilePictureUrl }
//         : {}),
//       ...(values?.bio ? { bio: values?.bio } : {}),
//       usualPosition: values.usualPosition,
//       createdAt: Timestamp.now(),
//     };
//     console.log({ playerData });
//     setLoading(true);
//     await addDoc(collection(db, "players"), playerData);

//     message.success("Player created");

//     setLoading(false);
//     navigate("/players");
//   };
//   const [form] = Form.useForm();
//   return (
//     <Card title="Create Player" style={{ maxWidth: 600 }}>
//       <Form<CreatePlayerFormValues>
//         form={form}
//         layout="vertical"
//         onFinish={onFinish}
//       >
//         <Form.Item label="Name" name="name" rules={[{ required: true }]}>
//           <Input />
//         </Form.Item>

//         <Form.Item label="Nickname" name="nickname">
//           <Input />
//         </Form.Item>

//         <Form.Item label="Birthday" name="birthday">
//           <DatePicker style={{ width: "100%" }} />
//         </Form.Item>

//         <Form.Item label="Profile Picture" name="profilePictureUrl">
//           <Input />
//         </Form.Item>
//         {/* <Form.Item label="Profile Picture" name="profilePictureUrl">
//           <ImageUploader
//             onChange={(url) => form.setFieldValue("profilePictureUrl", url)}
//           />
//         </Form.Item> */}

//         <Form.Item label="Bio" name="bio">
//           <Input.TextArea rows={3} />
//         </Form.Item>

//         <Form.Item label="Usual Position" name="usualPosition">
//           <Select
//             allowClear
//             options={[
//               "GK",
//               "CB",
//               "LB",
//               "RB",
//               "CDM",
//               "CM",
//               "CAM",
//               "LW",
//               "RW",
//               "ST",
//             ].map((p) => ({ value: p, label: p }))}
//           />
//         </Form.Item>

//         <Button
//           loading={loading}
//           disabled={loading}
//           type="primary"
//           htmlType="submit"
//         >
//           Save
//         </Button>
//       </Form>
//     </Card>
//   );
// }

import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Select,
  message,
  Row,
  Col,
  Typography,
  Upload,
  Divider,
  Space,
  App as AntdApp,
  Tag,
} from "antd";
import {
  PlusOutlined,
  LoadingOutlined,
  TrophyOutlined,
  SaveOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate, useParams } from "react-router-dom";
import type { Player } from "../types/Player";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function CreatePlayer() {
  const { playerId } = useParams(); // Detect if we are editing
  const isEdit = !!playerId;
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [imgLoading, setImgLoading] = useState(false);

  const [previewData, setPreviewData] = useState<Partial<Player>>({
    name: "",
    usualPosition: "ST",
    nickname: "",
    profilePictureUrl: "",
  });

  // 1. Fetch Data if Editing
  useEffect(() => {
    if (isEdit) {
      const fetchPlayer = async () => {
        try {
          const docRef = doc(db, "players", playerId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            const formattedData = {
              ...data,
              birthday: data.birthday
                ? dayjs(data.birthday.toDate())
                : undefined,
            };
            form.setFieldsValue(formattedData);
            setPreviewData(formattedData as Player);
          } else {
            message.error("Player not found");
            navigate("/players");
          }
        } catch (error) {
          message.error("Error loading player");
        } finally {
          setFetching(false);
        }
      };
      fetchPlayer();
    }
  }, [playerId, isEdit, form, navigate]);

  const onValuesChange = (_: any, allValues: any) => {
    setPreviewData(allValues);
  };

  // const handleUpload = async (info: any) => {
  //   if (info.file.status === "uploading") {
  //     setImgLoading(true);
  //     return;
  //   }
  //   // Note: For a real app, upload info.file.originFileObj to Firebase Storage here
  //   const url = URL.createObjectURL(info.file.originFileObj);
  //   form.setFieldValue("profilePictureUrl", url);
  //   setPreviewData((prev) => ({ ...prev, profilePictureUrl: url }));
  //   setImgLoading(false);
  // };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const playerData = {
        name: values.name,
        nickname: values.nickname || "",
        birthday: values.birthday
          ? Timestamp.fromDate(values.birthday.toDate())
          : null,
        profilePictureUrl: values.profilePictureUrl || "",
        bio: values.bio || "",
        usualPosition: values.usualPosition,
        updatedAt: Timestamp.now(),
      };

      if (isEdit) {
        await updateDoc(doc(db, "players", playerId), playerData);
        message.success("Transfer record updated!");
      } else {
        await addDoc(collection(db, "players"), {
          ...playerData,
          createdAt: Timestamp.now(),
        });
        message.success(`${values.name} officially joined the squad!`);
      }
      navigate("/players");
    } catch (error) {
      console.error(error);
      message.error("Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  if (fetching)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <LoadingOutlined style={{ fontSize: 40 }} />
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: "20px 0" }}
    >
      <Title level={2}>
        {isEdit ? `Edit Profile: ${previewData.name}` : "New Signing"}
      </Title>

      <Row gutter={[32, 32]}>
        {/* FORM SIDE */}
        <Col xs={24} lg={14}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              onValuesChange={onValuesChange}
              initialValues={{ usualPosition: "CM" }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Name"
                    name="name"
                    rules={[{ required: true }]}
                  >
                    <Input size="large" placeholder="Leo Messi" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Nickname" name="nickname">
                    <Input size="large" placeholder="La Pulga" />
                  </Form.Item>
                </Col>
              </Row>

              {/* <Form.Item label="Profile Picture">
                <Upload
                  listType="picture-card"
                  showUploadList={false}
                  customRequest={({ onSuccess }: any) => onSuccess("ok")}
                  onChange={handleUpload}
                >
                  {previewData.profilePictureUrl ? (
                    <img
                      src={previewData.profilePictureUrl}
                      alt="avatar"
                      style={{ width: "100%", borderRadius: 8 }}
                    />
                  ) : (
                    <div>
                      {imgLoading ? <LoadingOutlined /> : <PlusOutlined />}
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  )}
                </Upload>
                <Form.Item name="profilePictureUrl" noStyle>
                  <Input type="hidden" />
                </Form.Item>
              </Form.Item> */}
              <Form.Item
                label="Profile Picture URL"
                name="profilePictureUrl"
                tooltip="Paste a link to an image (Discord, Imgur, etc.)"
              >
                <Input
                  size="large"
                  prefix={<LinkOutlined style={{ color: "#bfbfbf" }} />}
                  placeholder="https://example.com/photo.jpg"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Position" name="usualPosition">
                    <Select
                      size="large"
                      options={[
                        "GK",
                        "CB",
                        "LB",
                        "RB",
                        "CDM",
                        "CM",
                        "CAM",
                        "LW",
                        "RW",
                        "ST",
                      ].map((p) => ({ value: p, label: p }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Birthday" name="birthday">
                    <DatePicker style={{ width: "100%" }} size="large" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Bio" name="bio">
                <Input.TextArea rows={4} placeholder="Scouting report..." />
              </Form.Item>

              <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                <Button size="large" onClick={() => navigate("/players")}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  icon={<SaveOutlined />}
                  style={{ minWidth: 150, borderRadius: 8 }}
                >
                  {isEdit ? "Update Player" : "Sign Player"}
                </Button>
              </Space>
            </Form>
          </Card>
        </Col>

        {/* PREVIEW SIDE */}
        <Col xs={24} lg={10}>
          <div style={{ position: "sticky", top: 100 }}>
            <Divider orientation="left">Player Card Preview</Divider>
            <AnimatePresence mode="wait">
              <motion.div
                key={previewData.name}
                initial={{ opacity: 0, rotateY: -20 }}
                animate={{ opacity: 1, rotateY: 0 }}
                transition={{ type: "spring", stiffness: 100 }}
              >
                <Card
                  cover={
                    <div
                      style={{
                        height: 300,
                        background:
                          "linear-gradient(135deg, #1d3557 0%, #457b9d 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {previewData.profilePictureUrl ? (
                        <img
                          src={previewData.profilePictureUrl}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <TrophyOutlined
                          style={{
                            fontSize: 100,
                            color: "rgba(255,255,255,0.1)",
                          }}
                        />
                      )}
                    </div>
                  }
                  style={{
                    borderRadius: 20,
                    overflow: "hidden",
                    border: "none",
                    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <Tag
                      color="cyan"
                      style={{ fontWeight: "bold", borderRadius: 4 }}
                    >
                      {previewData.usualPosition || "???"}
                    </Tag>
                    <Title level={3} style={{ marginTop: 10, marginBottom: 0 }}>
                      {previewData.name || "Sign Him Up!"}
                    </Title>
                    <Text type="secondary">
                      {previewData.nickname
                        ? `"${previewData.nickname}"`
                        : "New Recruit"}
                    </Text>
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </Col>
      </Row>
    </motion.div>
  );
}
