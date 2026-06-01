import { baseApi } from "./baseApi";

const USER_BASE_URL = "/users";

export const userApi = baseApi.injectEndpoints({
  tagTypes: ["User"],

  endpoints: (builder) => ({
    loginUser: builder.mutation({
      query: (body) => ({
        url: `${USER_BASE_URL}/login`,
        method: "POST",
        body,
      }),
    }),

    createUser: builder.mutation({
      query: (body) => ({
        url: `${USER_BASE_URL}`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),

    getUserById: builder.query({
      query: (id) => `${USER_BASE_URL}/${id}`,
      providesTags: (result, error, id) => [{ type: "User", id }],
    }),

    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `${USER_BASE_URL}/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),

    updateMyProfile: builder.mutation({
      query: (body) => ({
        url: `${USER_BASE_URL}/profile`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "User", id: "ME" }],
    }),

    changeMyPassword: builder.mutation({
      query: (body) => ({
        url: `${USER_BASE_URL}/change-password`,
        method: "PUT",
        body,
      }),
    }),

    resetUserPassword: builder.mutation({
      query: (id) => ({
        url: `${USER_BASE_URL}/reset-password/${id}`,
        method: "PUT",
      }),
      invalidatesTags: (result, error, id) => [{ type: "User", id }],
    }),

    listUsers: builder.query({
      query: (params) => ({
        url: `${USER_BASE_URL}`,
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map((u) => ({ type: "User", id: u._id })), { type: "User", id: "LIST" }]
          : [{ type: "User", id: "LIST" }],
    }),
  }),
});

export const {
  useLoginUserMutation,
  useCreateUserMutation,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useUpdateMyProfileMutation,
  useChangeMyPasswordMutation,
  useResetUserPasswordMutation,
  useListUsersQuery,
} = userApi;
