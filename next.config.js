/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.wikia.nocookie.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.wikia.nocookie.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "onepiece.fandom.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/**",
      },
    ],
    // Fallback for images that fail to load
    unoptimized: false,
    // Allow larger images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Enable experimental features if needed
  experimental: {
    // Optimize package imports
    optimizePackageImports: ["@/components", "@/lib"],
  },
};

module.exports = nextConfig;
