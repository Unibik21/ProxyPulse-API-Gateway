import 'dotenv/config';

export const config = {
    port: Number(process.env.PORT) || 8080,
    downstreamUrl: process.env.DOWNSTREAM_URL || 'http://localhost:4000',
};
