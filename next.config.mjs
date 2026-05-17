/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a self-contained server in `.next/standalone` for the Docker
  // image. Removes the need to ship `node_modules` and shrinks the prod image
  // by an order of magnitude.
  output: "standalone",
};

export default nextConfig;
