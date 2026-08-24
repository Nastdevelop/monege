import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs", "@prisma/adapter-pg", "@prisma/client"],
};

export default nextConfig;
