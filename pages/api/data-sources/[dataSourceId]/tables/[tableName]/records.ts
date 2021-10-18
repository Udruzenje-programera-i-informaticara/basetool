import { decodeObject } from "@/lib/encoding";
import { getDataSourceFromRequest, getUserFromRequest } from "@/features/api";
import { merge } from "lodash";
import { serverSegment } from "@/lib/track";
import { withMiddlewares } from "@/features/api/middleware";
import ApiResponse from "@/features/api/ApiResponse";
import IsSignedIn from "@/features/api/middlewares/IsSignedIn";
import OwnsDataSource from "@/features/api/middlewares/OwnsDataSource";
import getQueryService from "@/plugins/data-sources/getQueryService";
import type { NextApiRequest, NextApiResponse } from "next";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> => {
  switch (req.method) {
    case "GET":
      return handleGET(req, res);
    case "POST":
      return handlePOST(req, res);
    default:
      return res.status(404).send("");
  }
};

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const dataSource = await getDataSourceFromRequest(req);

  if (!dataSource) return res.status(404).send("");

  const service = await getQueryService({ dataSource });

  const filters = decodeObject(req.query.filters as string);

  const [{ records, columns, meta }, count] = await service.runQueries([
    {
      name: "getRecords",
      payload: {
        tableName: req.query.tableName as string,
        filters,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : null,
        offset: req.query.offset
          ? parseInt(req.query.offset as string, 10)
          : null,
        orderBy: req.query.orderBy as string,
        orderDirection: req.query.orderDirection as string,
        startingAfter: req.query.startingAfter as string,
        endingBefore: req.query.endingBefore as string,
      },
    },
    {
      name: "getRecordsCount",
      payload: {
        tableName: req.query.tableName as string,
        filters,
      },
    },
  ]);

  res.json(
    ApiResponse.withData(records, { meta: merge({ count, columns }, meta) })
  );
}

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  if (!req?.body?.record || Object.keys(req.body.record).length === 0)
    return res.send(ApiResponse.withError("No record sent."));
  const dataSource = await getDataSourceFromRequest(req);

  if (!dataSource) return res.status(404).send("");

  const user = await getUserFromRequest(req);

  const service = await getQueryService({ dataSource });

  const { record } = req.body;

  const data = await service.runQuery("createRecord", {
    tableName: req.query.tableName as string,
    data: record,
  });

  serverSegment().track({
    userId: user ? user.id : "",
    event: "Created record",
    properties: {
      id: dataSource.type,
    },
  });

  res.json(ApiResponse.withData({ id: data }, { message: "Record added" }));
}

export default withMiddlewares(handler, {
  middlewares: [
    [IsSignedIn, {}],
    [OwnsDataSource, {}],
  ],
});
