/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma", "bcrypt", "pg"],
};

export default nextConfig;