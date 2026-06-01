import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface RootState {
  auth: {
    user: {
      token?: string;
    } | null;
  };
}

export const baseApi = createApi({
  tagTypes: [
    "Admin",
    "AdminDashboard",
    "Announcement",
    "Authorization",
    "Dashboard",
    "Event",
    "Member",
    "Notification",
    "Task",
    "User",
  ],

  reducerPath: "baseApi",

  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL as string,

    prepareHeaders: (headers, { getState }) => {
      const user = (getState() as RootState).auth.user;

      // ONLY token is valid based on user schema
      if (user?.token) {
        headers.set("authorization", `Bearer ${user.token}`);
      }

      return headers;
    },
  }),

  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "/users/login",
        method: "POST",
        body: credentials,
      }),
    }),
  }),
});

export const { useLoginMutation } = baseApi;
