import React, { useState } from "react";
import { Layout, Menu, Button, Drawer, Space } from "antd";
import {
  MenuOutlined,
  TrophyOutlined,
  UserOutlined,
  DashboardOutlined,
  ThunderboltOutlined,
  LogoutOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { motion } from "framer-motion";

const { Header } = Layout;

const Navbar = () => {
  const user = useAuth();
  const location = useLocation();
  const [mobileVisible, setMobileVisible] = useState(false);

  // Define nav items - Excludes devseed and login
  const menuItems = [
    {
      key: "/dashboard",
      label: "Dashboard",
      icon: <DashboardOutlined />,
      //   protected: true,
    },
    {
      key: "/matches",
      label: "Matches",
      icon: <ThunderboltOutlined />,
      //   protected: true,
    },
    {
      key: "/players",
      label: "Players",
      icon: <TeamOutlined />,
      //   protected: true,
    },
    {
      key: "/custom-stats",
      label: "Stats Config",
      icon: <TrophyOutlined />,
      protected: true,
    },
    {
      key: "/login",
      label: "Login",
      icon: <TrophyOutlined />,
      protected: true,
      onlyPublic: true,
    },
  ];
  console.log({ user });
  // Filter items based on whether user is logged in
  const visibleItems = menuItems.filter(
    (item) =>
      !item.protected ||
      (user && !item.onlyPublic) ||
      (item.onlyPublic && !user)
  );

  const NavMenu = ({ mode }: { mode: "horizontal" | "vertical" }) => (
    <Menu
      theme="dark"
      mode={mode}
      selectedKeys={[location.pathname]}
      style={{ borderBottom: 0, flex: 1, justifyContent: "end" }}
      items={visibleItems.map((item) => ({
        key: item.key,
        icon: item.icon,
        label: <Link to={item.key}>{item.label}</Link>,
      }))}
    />
  );

  return (
    <Header
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        justifyContent: "space-between",
        background: "#001529",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        width: "100%",
      }}
    >
      {/* Brand Logo with Animation */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            color: "#1890ff",
            fontWeight: "bold",
            fontSize: "1.2rem",
            marginRight: "40px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            justifyContent: "space-between",
          }}
        >
          <TrophyOutlined style={{ fontSize: "1.5rem" }} />
          <span className="nav-logo-text">Ball Knowledge</span>
        </div>
      </motion.div>

      {/* Desktop Menu */}
      <div
        style={{ flex: 1, display: "none", md: "block" }}
        className="desktop-menu"
      >
        <NavMenu mode="horizontal" />
      </div>
      <div
        className="mobile-toggle"
        style={{ cursor: "pointer", display: "none" }}
        onClick={() => setMobileVisible(true)}
      >
        <MenuOutlined style={{ color: "white" }} />
      </div>
      {/* Mobile Toggle */}
      {/* <Button
        className="mobile-toggle"
        type="text"
        // icon={<MenuOutlined style={{ color: "white" }} />}
        onClick={() => setMobileVisible(true)}
        style={{ color: "white" }}
        // style={{ display: "none", marginLeft: "0" }}
      >
        hello
        <MenuOutlined style={{ color: "white" }} />
      </Button> */}

      <Drawer
        title="Menu"
        placement="right"
        onClose={() => setMobileVisible(false)}
        open={mobileVisible}
        styles={{
          body: { padding: 0, background: "#001529" },
          header: { background: "#001529", color: "white" },
        }}
        style={{ color: "white" }}
      >
        <NavMenu mode="vertical" />
      </Drawer>

      <style>{`
        @media (max-width: 768px) {
          .desktop-menu { display: none !important; }
          .mobile-toggle { display: block !important; }
        //   .nav-logo-text { display: none; }
        }
        @media (min-width: 769px) {
          .desktop-menu { display: flex !important; }
        }
      `}</style>
    </Header>
  );
};

export default Navbar;
