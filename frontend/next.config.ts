import path from "path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Load master .env from the project root
loadEnvConfig(path.resolve(__dirname, ".."));

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
