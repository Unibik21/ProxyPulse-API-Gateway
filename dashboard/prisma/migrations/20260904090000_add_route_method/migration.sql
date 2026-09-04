-- Add the HTTP method used when matching a route.
ALTER TABLE "Route" ADD COLUMN "method" TEXT NOT NULL DEFAULT 'GET';