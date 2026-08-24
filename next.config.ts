import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcrypt", "@prisma/adapter-pg", "@prisma/client"],
};

export default nextConfig;
