import { Module } from '@nestjs/common';
import { EnvService } from './env.service';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from './env';

@Module({
    imports: [
        ConfigModule.forRoot({
            validate: (env) => envSchema.parse(env),
            isGlobal: true,
        }),
    ],
    providers: [EnvService],
    exports: [EnvService],
})
export class EnvModule {}
