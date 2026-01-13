import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <div style={{ padding: 24 }}>{children}</div>;
}
