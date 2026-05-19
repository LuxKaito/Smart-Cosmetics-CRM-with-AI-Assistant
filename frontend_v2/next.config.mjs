/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: "http",
                hostname: "localhost",
                port: "5000",
                pathname: "/**",
            },
            {
                protocol: "http",
                hostname: "127.0.0.1",
                port: "5000",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "media.hcdn.vn",
                pathname: "/**",
            },
        ],
    },
};

export default nextConfig;
