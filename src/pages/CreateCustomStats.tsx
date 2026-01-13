import { Button, Card, Checkbox, Form, Input, Radio, message } from "antd";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";

export default function CreateCustomStat() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await addDoc(collection(db, "customStats"), {
        name: values.name,
        description: values.description || null,
        unit: values.unit || null,
        per90: values.per90 || false,
        type: values.type,
        createdAt: Timestamp.now(),
      });

      message.success("Custom stat created");
      navigate("/custom-stats");
    } catch (err) {
      console.error(err);
      message.error("Failed to create stat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Create Custom Stat" style={{ maxWidth: 600 }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          type: "count",
          per90: false,
        }}
      >
        <Form.Item
          label="Stat Name"
          name="name"
          rules={[{ required: true, message: "Stat name is required" }]}
        >
          <Input placeholder="e.g. Nutmegs" />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <Input.TextArea placeholder="Optional explanation" />
        </Form.Item>

        <Form.Item label="Type" name="type">
          <Radio.Group>
            <Radio value="count">Count</Radio>
            <Radio value="ratio">Ratio</Radio>
            <Radio value="boolean">Boolean</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="Unit" name="unit">
          <Input placeholder="e.g. %, times, goals" />
        </Form.Item>

        <Form.Item name="per90" valuePropName="checked">
          <Checkbox>Per 90 minutes</Checkbox>
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={loading}>
          Save
        </Button>
      </Form>
    </Card>
  );
}
