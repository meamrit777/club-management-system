import { useMemo } from "react";
import { useSelector } from "react-redux";
import { IUser } from "../interfaces/index";

import { selectLoggedInUser } from "../store/authSlice";

interface AuthHookReturn {
  loggedInUser: IUser | null;

  isAuthenticated: boolean;

  isSuperAdmin: boolean;
  isAdmin: boolean;
  isMember: boolean;
}

export const useAuth = (): AuthHookReturn => {
  const loggedInUser = useSelector(selectLoggedInUser) as IUser | null;

  return useMemo(() => {
    const isAuthenticated = !!loggedInUser;

    const isSuperAdmin = loggedInUser?.role === "SuperAdmin";

    const isAdmin = loggedInUser?.role === "Admin" || isSuperAdmin;

    const isMember = loggedInUser?.role === "Member";

    return {
      loggedInUser,

      isAuthenticated,

      isSuperAdmin,
      isAdmin,
      isMember,
    };
  }, [loggedInUser]);
};
