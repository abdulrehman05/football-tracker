import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Players from "./pages/Players";
import CreatePlayer from "./pages/CreatePlayer";
import ProtectedRoute from "./auth/ProtectedRoute";
import { AuthProvider } from "./auth/AuthContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import CustomStats from "./pages/CustomStats";
import CreateCustomStat from "./pages/CreateCustomStats";
import Matches from "./pages/Matches";
import CreateMatch from "./pages/CreateMatches";
import Dashboard from "./pages/Dashboard";
import DevSeed from "./pages/DevSeed";
import AppNavbar from "./components/AppNavbar";
import { Layout } from "antd";

dayjs.extend(relativeTime);
export default function App() {
  return (
    <AuthProvider>
      {" "}
      <Layout style={{ minHeight: "100vh" }}>
        <AppNavbar />

        <Layout.Content>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/players"
              element={
                <div style={{ padding: 24 }}>
                  <Players />
                </div>
              }
              // element={
              //   <ProtectedRoute>
              //     <Players />
              //   </ProtectedRoute>
              // }
            />

            <Route
              path="/players/new"
              element={
                <ProtectedRoute>
                  <CreatePlayer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/players/edit/:playerId"
              element={
                <ProtectedRoute>
                  <CreatePlayer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/matches"
              // element={
              //   <ProtectedRoute>
              //     <Matches />
              //   </ProtectedRoute>
              // }
              element={
                <div style={{ padding: 24 }}>
                  <Matches />
                </div>
              }
            />
            <Route
              path="/matches/new"
              element={
                <ProtectedRoute>
                  <CreateMatch />
                </ProtectedRoute>
              }
            />
            <Route
              path="/matches/edit/:matchId"
              element={
                <ProtectedRoute>
                  <CreateMatch />
                </ProtectedRoute>
              }
            />
            <Route
              path="/custom-stats"
              element={
                <ProtectedRoute>
                  <CustomStats />
                </ProtectedRoute>
              }
            />
            <Route
              path="/custom-stats/new"
              element={
                <ProtectedRoute>
                  <CreateCustomStat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              // element={
              //   <ProtectedRoute>
              //     <Dashboard />
              //   </ProtectedRoute>
              // }
              element={
                <div style={{ padding: 24 }}>
                  <Dashboard />
                </div>
              }
            />
            {/* <Route
              path="/devseed"
              element={
                <ProtectedRoute>
                  <DevSeed />
                </ProtectedRoute>
              }
            /> */}
          </Routes>
        </Layout.Content>
      </Layout>
    </AuthProvider>
  );
}
