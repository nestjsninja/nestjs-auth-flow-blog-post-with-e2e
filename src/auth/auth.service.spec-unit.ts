import { TestingModule, Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import {
    InternalServerErrorException,
    UnauthorizedException,
} from '@nestjs/common';

describe('AuthService', () => {
    let authService: AuthService;
    let usersServiceMock: UsersService;
    let jwtServiceMock: JwtService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UsersService,
                    useValue: {
                        validateCredentials: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        signAsync: jest.fn(),
                    },
                },
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        usersServiceMock = module.get<UsersService>(UsersService);
        jwtServiceMock = module.get<JwtService>(JwtService);
    });

    it('should sign in a user and return an access token', async () => {
        const user = {
            id: 1,
            username: 'testuser',
            password: 'password',
        };

        usersServiceMock.validateCredentials.mockResolvedValueOnce(user);
        jwtServiceMock.signAsync.mockResolvedValueOnce('token');

        const response = await authService.signIn('testuser', 'password');

        expect(response).toEqual({ access_token: 'token' });
    });

    it('should throw an UnauthorizedException if the user cannot be signed in', async () => {
        usersServiceMock.validateCredentials.mockResolvedValueOnce(null);

        await expect(
            authService.signIn('testuser', 'password'),
        ).rejects.toThrowError(UnauthorizedException);
    });

    it('should sign up a user and return the user', async () => {
        const user = {
            id: 1,
            username: 'testuser',
            password: 'password',
        };

        usersServiceMock.create.mockResolvedValueOnce(user);

        const response = await authService.signUp('testuser', 'password');

        expect(response).toEqual(user);
        expect(response.password).toBeUndefined();
    });

    it('should throw an InternalServerErrorException if the user cannot be signed up', async () => {
        usersServiceMock.create.mockRejectedValueOnce(new Error());

        await expect(
            authService.signUp('testuser', 'password'),
        ).rejects.toThrowError(Error);
    });
});
