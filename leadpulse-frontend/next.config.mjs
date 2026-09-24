import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'standalone', // Breaks Vercel deployments!
  reactCompiler: true,
  turbopack: {
    root: path.join(__dirname, '../'),
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://leadpulse-alb-v4-aryan-1263877118.ap-south-1.elb.amazonaws.com/api/:path*'
      }
    ];
  }
};

export default nextConfig;
