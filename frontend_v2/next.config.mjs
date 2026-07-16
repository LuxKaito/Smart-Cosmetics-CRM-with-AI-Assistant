/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: "standalone",
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
            {
                protocol: "https",
                hostname: "i.pravatar.cc",
                pathname: "/**",
            },
        ],
    },
};

export default nextConfig;
