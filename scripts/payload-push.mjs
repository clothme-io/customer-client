process.env.DISABLE_PAYLOAD_HMR = "true";
process.env.NODE_ENV = "development";

const { getPayload } = await import("payload");
const configModule = await import("../src/payload.config.js");
const config = await configModule.default;

const payload = await getPayload({
  config,
  disableOnInit: true
});

await payload.destroy();

console.log("Payload CMS schema is ready.");
