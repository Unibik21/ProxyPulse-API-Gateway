import "dotenv/config";

export const config = {
    port: Number(process.env.PORT) || 7000,
    controlPlaneUrl: process.env.CONTROL_PLANE_URL || 'http://localhost:3000',
};
