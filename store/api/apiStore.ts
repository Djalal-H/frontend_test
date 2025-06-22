import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getSession, signOut } from "next-auth/react";
import axios from "axios";
import https from "https";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://5.75.165.29";

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: async (headers) => {
    const session = await getSession();
    if (session?.access) {
      headers.set("Authorization", `Bearer ${session.access}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    console.log("Access token expired, attempting to refresh...");

    // Get current session to access refresh token
    const session = await getSession();

    if (session?.refresh) {
      try {
        // Attempt to refresh the token
        const API_URL =
          process.env.NEXT_PUBLIC_API_BASE_URL || "https://5.75.165.29";
        const httpsAgent = new https.Agent({
          rejectUnauthorized: false,
        });

        const refreshResponse = await axios.post(
          `${API_URL}/token_refresh/`,
          {
            refresh: session.refresh,
          },
          { httpsAgent }
        );

        const refreshedTokens = refreshResponse.data;

        if (refreshedTokens.access) {
          console.log("Token refreshed successfully");

          // Update the session with new tokens
          // The updated token will be available in the next getSession() call

          // A new baseQuery with the new token
          const refreshedBaseQuery = fetchBaseQuery({
            baseUrl: API_URL,
            prepareHeaders: (headers) => {
              headers.set("Authorization", `Bearer ${refreshedTokens.access}`);
              return headers;
            },
          });

          // Retry the original query with the new token
          result = await refreshedBaseQuery(args, api, extraOptions);

          // Trigger a session update by calling getSession again
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
      } catch (error) {
        console.error("Token refresh failed:", error);
        signOut({ callbackUrl: "/login" });
      }
    } else {
      // No refresh token available, sign out
      signOut({ callbackUrl: "/login" });
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Sales", "Customer", "Warehouse"],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation({
      query: (credentials) => ({
        url: "/account/create_token/",
        method: "POST",
        body: credentials,
      }),
    }),

    // Sales endpoints
    getSales: builder.query<any, Record<string, any>>({
      query: (params) => ({
        url: "/sales",
        method: "GET",
        params,
      }),
    }),
    getSale: builder.query({
      query: (uuid) => `/sales/${uuid}/`,
      providesTags: (result, error, uuid) => [{ type: "Sales", id: uuid }],
    }),
    getSaleLines: builder.query({
      query: (uuid) => `/sales/${uuid}/lines/`,
    }),
    createSale: builder.mutation({
      query: (saleData) => ({
        url: "/sales/create/",
        method: "POST",
        body: saleData,
      }),
      invalidatesTags: ["Sales"],
    }),
    deleteSale: builder.mutation({
      query: (uuid) => ({
        url: `/sales/${uuid}/delete/`,
        method: "DELETE",
      }),
      // Optimistic update
      async onQueryStarted(uuid, { dispatch, queryFulfilled }) {
        // Optimistically update the cache
        const patchResult = dispatch(
          apiSlice.util.updateQueryData(
            "getSales",
            { page: 1, page_size: 10, is_received: true },
            (draft) => {
              if (draft?.results) {
                draft.results = draft.results.filter(
                  (sale: any) => sale.uuid !== uuid
                );
              }
            }
          )
        );

        try {
          await queryFulfilled;
        } catch {
          // If the delete fails, revert the optimistic update
          patchResult.undo();
        }
      },
      invalidatesTags: ["Sales"],
    }),
    getCustomers: builder.query({
      query: () => "/customers/",
      providesTags: ["Customer"],
    }),
    getWarehouses: builder.query({
      query: () => "/warehouses/",
      providesTags: ["Warehouse"],
    }),
    getWarehouseInventory: builder.query({
      query: (uuid) => `/warehouses/${uuid}/inventory?ordering=product__name`,
    }),
  }),
});

export const {
  useLoginMutation,
  useGetSalesQuery,
  useGetSaleQuery,
  useGetSaleLinesQuery,
  useCreateSaleMutation,
  useDeleteSaleMutation,
  useGetCustomersQuery,
  useGetWarehousesQuery,
  useGetWarehouseInventoryQuery,
} = apiSlice;
