import { compressImageFile } from "./imageCompress";
import { track } from "./track";
import { sessionFetch } from "../../app/(webclient)/lib/session-client";
import { createSizeToolRunner } from "./sizeToolPipeline";
export const runSizeTool = createSizeToolRunner({
  fetcher: sessionFetch,
  compress: compressImageFile,
  track,
});
