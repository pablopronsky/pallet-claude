/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // @react-pdf/renderer y xlsx solo se importan dinámicamente desde el
  // cliente; los marcamos como externos para que no se bundleen al SSR.
  serverExternalPackages: ["@react-pdf/renderer", "xlsx"],
};

export default nextConfig;
