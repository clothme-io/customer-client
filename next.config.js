import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // Avoid EMFILE on macOS when the process file-watch limit is low.
  // Without this, broken HMR can leave pages blank (Next FOUC hide never clears).
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ["**/node_modules/**", "**/.git/**", "**/.next/**"]
      };
    }
    return config;
  }
};

export default withPayload(nextConfig);
