import { apiUrl } from "../api/urls";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import ApiResponse from "../api/ApiResponse";
import URI from "urijs";

export const recordsApiSlice = createApi({
  reducerPath: "records",
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiUrl}`,
  }),
  tagTypes: ["Record"],
  endpoints(builder) {
    return {
      getRecords: builder.query<
        ApiResponse,
        {
          dataSourceId: string;
          tableName: string;
          filters?: string;
          limit?: string;
          offset?: string;
          orderBy?: string;
          orderDirection?: string;
          startingAfter?: string;
          endingBefore?: string;
        }
      >({
        query: ({
          dataSourceId,
          tableName,
          filters,
          limit,
          offset,
          orderBy,
          orderDirection,
          startingAfter,
          endingBefore,
        }) => {
          const queryParams = URI()
            .query({
              filters,
              limit,
              offset,
              orderBy,
              orderDirection,
              startingAfter,
              endingBefore,
            })
            .query()
            .toString();

          return `/data-sources/${dataSourceId}/tables/${tableName}/records?${queryParams}`;
        },
        providesTags: (response) => {
          // is result available?
          if (response && response?.data) {
            // successful query
            return [
              ...response?.data?.map(
                ({ id }: { id: string | number }) =>
                  ({ type: "Record", id } as const)
              ),
              { type: "Record", id: "LIST" },
            ];
          }

          // an error occurred, but we still want to refetch this query when `{ type: 'Posts', id: 'LIST' }` is invalidated
          return [{ type: "Record", id: "LIST" }];
        },
      }),
      getRecord: builder.query<
        ApiResponse,
        { dataSourceId: string; tableName: string; recordId?: string }
      >({
        query({ dataSourceId, tableName, recordId }) {
          return `/data-sources/${dataSourceId}/tables/${tableName}/records/${recordId}`;
        },
        providesTags: (result, error, { recordId }) => [
          { type: "Record", id: recordId },
        ],
      }),
      createRecord: builder.mutation<
        ApiResponse,
        Partial<{
          dataSourceId: string;
          tableName: string;
          body: Record<string, unknown>;
        }>
      >({
        query: ({ dataSourceId, tableName, body }) => ({
          url: `${apiUrl}/data-sources/${dataSourceId}/tables/${tableName}/records`,
          method: "POST",
          body,
        }),
        invalidatesTags: [{ type: "Record", id: "LIST" }],
      }),
      updateRecord: builder.mutation<
        ApiResponse,
        Partial<{
          dataSourceId: string;
          tableName: string;
          recordId: string;
          body: Record<string, unknown>;
        }>
      >({
        query: ({ dataSourceId, tableName, recordId, body }) => ({
          url: `${apiUrl}/data-sources/${dataSourceId}/tables/${tableName}/records/${recordId}`,
          method: "PUT",
          body,
        }),
        invalidatesTags: (result, error, { recordId }) => [
          { type: "Record", id: recordId },
        ],
      }),
      deleteRecord: builder.mutation<
        ApiResponse,
        Partial<{
          dataSourceId: string;
          tableName: string;
          recordId: string;
        }>
      >({
        query: ({ dataSourceId, tableName, recordId }) => ({
          url: `${apiUrl}/data-sources/${dataSourceId}/tables/${tableName}/records/${recordId}`,
          method: "DELETE",
        }),
        invalidatesTags: (result, error, { recordId }) => [
          { type: "Record", id: recordId },
        ],
      }),
      deleteBulkRecords: builder.mutation<
        ApiResponse,
        Partial<{
          dataSourceId: string;
          tableName: string;
          recordIds: number[];
        }>
      >({
        query: ({ dataSourceId, tableName, recordIds }) => ({
          url: `${apiUrl}/data-sources/${dataSourceId}/tables/${tableName}/records/bulk`,
          method: "DELETE",
          body: recordIds,
        }),
        invalidatesTags: (result, error, { recordIds }) => {
          if (!recordIds) return [{ type: "Record", id: "LIST" }];

          const tagsForRecords = recordIds.map((recordId) => ({
            type: "Record",
            id: recordId.toString(),
          }));

          return [...tagsForRecords, { type: "Record", id: "LIST" }] as {
            type: "Record";
            id: string;
          }[];
        },
      }),
    };
  },
});

export const {
  useGetRecordsQuery,
  useGetRecordQuery,
  useCreateRecordMutation,
  useUpdateRecordMutation,
  usePrefetch,
  useDeleteRecordMutation,
  useDeleteBulkRecordsMutation,
} = recordsApiSlice;
