import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DISCORD_CLIENT_ID: z.string().min(1),
    DISCORD_TOKEN: z.string().min(1),
    DISCORD_DEV_GUILD_ID: z.string().min(1),
    DISCORD_SHARD_COUNT: z.number().int().min(1),
    DATABASE_URL: z.string().min(1),
    DATABASE_NAMESPACE: z.string().min(1),
    DATABASE_USERNAME: z.string().min(1),
    DATABASE_PASSWORD: z.string().min(1),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },
  runtimeEnv: process.env,
});
