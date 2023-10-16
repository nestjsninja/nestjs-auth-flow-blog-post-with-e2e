import { z } from 'zod';

export const envSchema = z.object({
    PORT: z.coerce.number().optional().default(3000),
    NODE_ENV: z.coerce.string().optional().default('development'),
});

export type Env = z.infer<typeof envSchema>;
