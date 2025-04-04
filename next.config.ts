/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    domains: [
      'lh3.googleusercontent.com', // Google user profile images
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
    ],
    dangerouslyAllowSVG: true, // Allow SVG images
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Ensure static assets are properly handled
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;