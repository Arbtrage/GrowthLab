import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@excalidraw/excalidraw"],
  serverExternalPackages: ["postgres", "@supabase/supabase-js", "@supabase/ssr"],
};

export default nextConfig;
