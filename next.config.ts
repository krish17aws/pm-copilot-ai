import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the local demo and screen recordings focused on the product UI.
  // Build and runtime errors still appear in the terminal.
  devIndicators: false,
};

export default nextConfig;
