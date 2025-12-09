/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/motor/:path*",
        destination: "http://192.168.1.100/motor/:path*",
      },
    ];
  },
};

export default nextConfig;
