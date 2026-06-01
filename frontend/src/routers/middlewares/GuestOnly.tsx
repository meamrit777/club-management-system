import type { ComponentType } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

type GuestOnlyProps = {
  component: ComponentType<Record<string, unknown>>;
  [key: string]: unknown;
};

const GuestOnly = ({ component: Component, ...props }: GuestOnlyProps) => {
  const { loggedInUser } = useAuth();

  if (!loggedInUser) {
    return <Component {...props} />;
  }

  return <Navigate to="/app" replace />;
};

export default GuestOnly;
