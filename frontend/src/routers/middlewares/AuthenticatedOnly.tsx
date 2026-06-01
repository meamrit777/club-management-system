import type { ComponentType } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

type AuthenticatedOnlyProps = {
  component: ComponentType<Record<string, unknown>>;
  [key: string]: unknown;
};

const AuthenticatedOnly = ({ component: Component, ...props }: AuthenticatedOnlyProps) => {
  const { loggedInUser } = useAuth();

  if (!loggedInUser) {
    return <Navigate to="/signin" replace />;
  }

  return <Component {...props} />;
};

export default AuthenticatedOnly;
