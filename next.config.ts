import type { NextConfig } from "next";

const useLocalBuildDir =
  process.env.VERCEL !== "1" &&
  process.env.CI !== "true" &&
  process.platform === "win32";

const nextConfig: NextConfig = {
  reactCompiler: true,
  ...(useLocalBuildDir ? { distDir: ".build" } : {}),
};

export default nextConfig;
