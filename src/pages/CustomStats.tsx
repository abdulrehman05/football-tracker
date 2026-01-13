import { Button, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import type { CustomStat } from "../types/CustomStat";
import dayjs from "dayjs";

export default function CustomStats() {
  const [stats, setStats] = useState<CustomStat[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "customStats"));
      setStats(
        snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CustomStat, "id">),
        }))
      );
      setLoading(false);
    };

    fetchStats();
  }, []);

  const columns: ColumnsType<CustomStat> = [
    {
      title: "Name",
      dataIndex: "name",
      render: (name) => <strong>{name}</strong>,
    },
    {
      title: "Type",
      dataIndex: "type",
      render: (type) => (
        <Tag
          color={
            type === "count" ? "blue" : type === "ratio" ? "purple" : "green"
          }
        >
          {type.toUpperCase()}
        </Tag>
      ),
      responsive: ["sm"],
    },
    {
      title: "Unit",
      dataIndex: "unit",
      render: (unit) => unit || "—",
      responsive: ["md"],
    },
    {
      title: "Per 90",
      dataIndex: "per90",
      render: (v) => (v ? "Yes" : "No"),
      responsive: ["md"],
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      render: (ts) => dayjs(ts.toDate()).fromNow(),
      responsive: ["lg"],
    },
  ];

  return (
    <>
      <Button
        type="primary"
        onClick={() => navigate("/custom-stats/new")}
        style={{ marginBottom: 16 }}
      >
        Add Custom Stat
      </Button>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={stats}
        columns={columns}
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
      />
    </>
  );
}
