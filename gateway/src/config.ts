import "dotenv/config";

export const config = {
  port: Number(process.env.PORT) || 8080,
  controlPlaneUrl: process.env.CONTROL_PLANE_URL || "http://localhost:3000",
};
