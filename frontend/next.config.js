/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://portfolio-monitoring-agent-main.onrender.com',
  },
}

module.exports = nextConfig
