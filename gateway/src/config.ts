import "dotenv/config";

export const config = {
<<<<<<< HEAD
  port: Number(process.env.PORT) || 7000,
  controlPlaneUrl: process.env.CONTROL_PLANE_URL || "http://localhost:3000",
<<<<<<< HEAD
=======
    port: Number(process.env.PORT) || 7000,
    controlPlaneUrl: process.env.CONTROL_PLANE_URL || 'http://localhost:3000',
>>>>>>> f1b54c6 (Correcting the mistakes)
=======
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
>>>>>>> fff5556 (Redis setup)
};

