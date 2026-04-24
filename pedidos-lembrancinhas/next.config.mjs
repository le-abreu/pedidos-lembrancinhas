const allowedOrigins = ["localhost:3000"];

const appUrl = process.env.APP_URL?.trim();
if (appUrl) {
  try {
    allowedOrigins.push(new URL(appUrl).host);
  } catch {
    allowedOrigins.push(appUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""));
  }
}

const extraAllowedOrigins = process.env.SERVER_ACTIONS_ALLOWED_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (extraAllowedOrigins?.length) {
  allowedOrigins.push(...extraAllowedOrigins);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      allowedOrigins: [...new Set(allowedOrigins)],
    },
  },
};

export default nextConfig;
