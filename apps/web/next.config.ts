import type { NextConfig } from "next";

const devOrigin = process.env.ALLOWED_DEV_ORIGIN;

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  cacheComponents: true,
  allowedDevOrigins: [devOrigin].filter(f),
};

function f(arg: string | undefined): arg is string {
  return !!arg;
}

export default nextConfig;
