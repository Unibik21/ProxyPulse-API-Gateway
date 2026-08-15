import "dotenv/config";

export const config = {
<<<<<<< HEAD
  port: Number(process.env.PORT) || 8080,
  controlPlaneUrl: process.env.CONTROL_PLANE_URL || "http://localhost:3000",
=======
    port: Number(process.env.PORT) || 7000,
    controlPlaneUrl: process.env.CONTROL_PLANE_URL || 'http://localhost:3000',
>>>>>>> d58ff72 (changes)
};
