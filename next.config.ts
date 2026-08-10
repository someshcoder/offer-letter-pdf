// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   serverExternalPackages: ["mongoose", "mongodb"],
// };

// export default nextConfig;


import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },

  serverExternalPackages: ["mongoose", "mongodb"],
};

export default nextConfig;