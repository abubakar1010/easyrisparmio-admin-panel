import { baseApi } from "../../api/baseApi";
import type {
  IClient,
  IClientQuery,
  ICreateClient,
  IUpdateClient,
  IUserPreference,
  IPaginatedResponse,
} from "../../../app/ClientManagement/types";

const clientApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClients: builder.query<IPaginatedResponse<IClient>, IClientQuery | void>({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          if (params.page) qp.set("page", String(params.page));
          if (params.limit) qp.set("limit", String(params.limit));
          if (params.search) qp.set("search", params.search);
          if (params.role) qp.set("role", params.role);
          if (params.status) qp.set("status", params.status);
        }
        return { url: `users?${qp.toString()}`, method: "GET" };
      },
      transformResponse: (response: { success: boolean; data: IPaginatedResponse<IClient> }) =>
        response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "user" as const, id })),
              { type: "user" as const, id: "LIST" },
            ]
          : [{ type: "user" as const, id: "LIST" }],
    }),

    getClientById: builder.query<IClient, string>({
      query: (id) => ({ url: `users/${id}`, method: "GET" }),
      transformResponse: (response: { success: boolean; data: IClient }) => response.data,
      providesTags: (_r, _e, id) => [{ type: "user" as const, id }],
    }),

    createClient: builder.mutation<IClient, ICreateClient>({
      query: (data) => ({ url: "users", method: "POST", body: data }),
      transformResponse: (response: { success: boolean; data: IClient }) => response.data,
      invalidatesTags: [{ type: "user", id: "LIST" }],
    }),

    updateClient: builder.mutation<IClient, { id: string; data: IUpdateClient }>({
      query: ({ id, data }) => ({ url: `users/${id}`, method: "PATCH", body: data }),
      transformResponse: (response: { success: boolean; data: IClient }) => response.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "user", id },
        { type: "user", id: "LIST" },
      ],
    }),

    deleteClient: builder.mutation<void, string>({
      query: (id) => ({ url: `users/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "user", id: "LIST" }],
    }),

    toggleClientStatus: builder.mutation<IClient, string>({
      query: (id) => ({ url: `users/${id}/toggle-status`, method: "PATCH" }),
      transformResponse: (response: { success: boolean; data: IClient }) => response.data,
      invalidatesTags: (_r, _e, id) => [
        { type: "user", id },
        { type: "user", id: "LIST" },
      ],
    }),

    resetClientPassword: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `users/${id}/reset-password`, method: "POST" }),
    }),

    getClientPreferences: builder.query<IUserPreference | null, string>({
      query: (id) => ({ url: `users/${id}/preferences`, method: "GET" }),
      transformResponse: (response: { success: boolean; data: IUserPreference | null }) =>
        response.data,
    }),

    updateClientPreferences: builder.mutation<
      IUserPreference,
      { id: string; data: Partial<IUserPreference> }
    >({
      query: ({ id, data }) => ({
        url: `users/${id}/preferences`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { success: boolean; data: IUserPreference }) => response.data,
    }),

    // Search users by name/email (lightweight, for dropdowns)
    searchUsers: builder.query<
      { id: string; firstName: string; lastName: string; email: string }[],
      string
    >({
      query: (search) => ({
        url: `users?search=${encodeURIComponent(search)}&limit=10`,
        method: "GET",
      }),
      transformResponse: (response: {
        success: boolean;
        data: {
          data: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
          }[];
        };
      }) => response.data.data,
    }),
  }),
});

export const {
  useGetClientsQuery,
  useGetClientByIdQuery,
  useLazyGetClientByIdQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
  useToggleClientStatusMutation,
  useResetClientPasswordMutation,
  useGetClientPreferencesQuery,
  useUpdateClientPreferencesMutation,
  useSearchUsersQuery,
} = clientApi;
