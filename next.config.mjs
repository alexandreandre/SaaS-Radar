/** @type {import('next').NextConfig} */
const nextConfig = {
  // framer-motion 12 dépend de motion-dom — évite des vendor-chunks manquants en dev
  transpilePackages: ["framer-motion", "motion-dom"],
};

export default nextConfig;
