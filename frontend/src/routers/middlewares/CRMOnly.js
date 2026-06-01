import { Navigate } from "react-router-dom";

import { useAuth } from "hooks/useAuth";

const CRMOnly = ({ component: Component, ...props }) => {
  const { isClient } = useAuth();

  if (isClient) return <Navigate to="/app/client" />;

  return <Component {...props} />;
};

export default CRMOnly;
