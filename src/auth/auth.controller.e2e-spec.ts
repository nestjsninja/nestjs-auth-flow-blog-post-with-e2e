import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Repository } from 'typeorm';
import { Users } from '../users/users.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthModule } from './auth.module';
import { DatabaseModule } from '../database/database.module';
import { EnvModule } from '../env/env.module';

const testUsername = 'authControllerE2ETests';

describe('AuthController', () => {
    let app: any;
    let httpServer: any;
    let repository: Repository<Users>;
    let authService: AuthService;

    beforeAll(async () => {
        const module = await Test.createTestingModule({
            imports: [EnvModule, DatabaseModule, AuthModule],
        }).compile();

        app = module.createNestApplication();
        authService = module.get<AuthService>(AuthService);
        repository = module.get<Repository<Users>>(getRepositoryToken(Users));

        await app.init();
        httpServer = app.getHttpServer();
    });

    afterAll(async () => {
        await app.close();
    });

    afterEach(async () => {
        await repository.delete({
            username: testUsername,
        });
    });

    describe('SingUp', () => {
        it('should create a user', async () => {
            const createUserRequest: { username: string; password: string } = {
                username: testUsername,
                password: 'password',
            };
            const response = await request(httpServer)
                .post('/auth/signUp')
                .send(createUserRequest);

            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body).toHaveProperty(
                'username',
                createUserRequest.username,
            );
            expect(response.body).toHaveProperty('id');

            const user = await repository.findOne({
                where: {
                    username: createUserRequest.username,
                },
            });
            expect(user).toMatchObject({
                username: createUserRequest.username,
            });
        });
    });

    describe('signIn', () => {
        it('should create the JWT', async () => {
            const createUserRequest = {
                username: testUsername,
                password: 'password',
            };
            const newUser = repository.create(createUserRequest);
            await repository.save(newUser);

            const signInRequest = {
                username: testUsername,
                password: 'password',
            };
            const signInResponse = await request(httpServer)
                .post('/auth/signIn')
                .send(signInRequest);

            expect(signInResponse.status).toBe(HttpStatus.OK);
            expect(signInResponse.body).toHaveProperty('access_token');
        });
    });

    describe('getProfile', () => {
        it('should get the user profile with valid JWT', async () => {
            const createUserRequest = {
                username: testUsername,
                password: 'password',
            };
            const newUser = repository.create(createUserRequest);
            await repository.save(newUser);

            const signInResponse = await authService.signIn(
                createUserRequest.username,
                createUserRequest.password,
            );

            expect(signInResponse).toHaveProperty('access_token');

            const { access_token } = signInResponse;

            const profileResponse = await request(httpServer)
                .get('/auth/profile')
                .set('Authorization', `Bearer ${access_token}`);

            expect(profileResponse.status).toBe(HttpStatus.OK);
            expect(profileResponse.body).toHaveProperty(
                'username',
                createUserRequest.username,
            );
        });

        it('should not get the user profile without a valid JWT', async () => {
            const profileResponse =
                await request(httpServer).get('/auth/profile');

            expect(profileResponse.status).toBe(HttpStatus.UNAUTHORIZED);
        });
    });
});
