import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "pub-467d4bec5ce94ee8a4fe02ac39879828.r2.dev",
      },
    ],
  },
};

export default nextConfig;
