// import { Button, Card, Form, Input, message } from "antd";
// import { signInWithEmailAndPassword } from "firebase/auth";
// import { auth } from "../firebase";
// import { useNavigate } from "react-router-dom";

// export default function Login() {
//   const router = useNavigate();
//   const onFinish = async (values: any) => {
//     try {
//       await signInWithEmailAndPassword(auth, values.email, values.password)
//         .then(() => {
//           console.log("hi");
//           router("/players");
//         })
//         .catch(() => {
//           message.error("Invalid credentials");
//         });
//     } catch {
//       message.error("Invalid credentials");
//     }
//   };

//   return (
//     <Card style={{ maxWidth: 400, margin: "100px auto" }}>
//       <Form layout="vertical" onFinish={onFinish}>
//         <Form.Item label="Email" name="email" required>
//           <Input />
//         </Form.Item>

//         <Form.Item label="Password" name="password" required>
//           <Input.Password />
//         </Form.Item>

//         <Button type="primary" htmlType="submit" block>
//           Login
//         </Button>
//       </Form>
//     </Card>
//   );
// }
import { Button, Card, Form, Input, message, Typography, Space } from "antd";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { LockOutlined, MailOutlined, TrophyOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useState } from "react";

const { Title, Text } = Typography;

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      message.success("Welcome back, Coach!");
      navigate("/players");
    } catch (error) {
      message.error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #001529 0%, #003a8c 100%)",
        padding: "20px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: "100%", maxWidth: 420 }}
      >
        <Card
          bordered={false}
          style={{
            borderRadius: 24,
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div
              style={{
                width: 64,
                height: 64,
                background: "#1890ff",
                borderRadius: 16,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                boxShadow: "0 8px 16px rgba(24, 144, 255, 0.3)",
              }}
            >
              <TrophyOutlined style={{ fontSize: 32, color: "#fff" }} />
            </div>
            <Title level={2} style={{ margin: 0 }}>
              Ball Knowledge
            </Title>
            <Text type="secondary">This is literal ball knowledge</Text>
          </div>

          <Form
            layout="vertical"
            onFinish={onFinish}
            size="large"
            requiredMark={false}
          >
            <Form.Item
              label={<Text strong>Email Address</Text>}
              name="email"
              rules={[{ required: true, message: "Please enter your email" }]}
            >
              <Input
                prefix={<MailOutlined style={{ color: "#bfbfbf" }} />}
                placeholder="coach@team.com"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              label={<Text strong>Password</Text>}
              name="password"
              rules={[
                { required: true, message: "Please enter your password" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
                placeholder="••••••••"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 40 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={{
                  height: 48,
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                  boxShadow: "0 4px 12px rgba(24, 144, 255, 0.4)",
                }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: "center" }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              © {new Date().getFullYear()} Squad Performance Center
            </Text>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
