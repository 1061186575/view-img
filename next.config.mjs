/** @type {import('next').NextConfig} */
const nextConfig = {
    /* config options here */
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '',
                pathname: '/**',
            },
        ],
        unoptimized: true, // 对于本地开发，禁用图片优化
    },
    // 允许静态文件服务
    async rewrites() {
        return [
            {
                source: '/media/:path*',
                destination: '/media/:path*',
            },
        ];
    },
};

export default nextConfig;
