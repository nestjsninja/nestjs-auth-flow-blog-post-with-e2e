import { UsersService } from './users.service';
import { Users } from './users.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpException } from '@nestjs/common';

export class userRepositoryMock {
    findOne = jest.fn();
    create = jest.fn();
    save = jest.fn();
}

describe('UsersService', () => {
    let usersService: UsersService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(Users),
                    useClass: userRepositoryMock,
                },
            ],
        }).compile();

        usersService = module.get<UsersService>(UsersService);
    });

    describe('findOneByUsername', () => {
        it('should return a user if found', async () => {
            const user = new Users();
            user.username = 'testuser';
            user.password = 'password';
            (usersService as any).userRepository.findOne.mockResolvedValueOnce(
                user,
            );
            const foundUser = await usersService.findOneByUsername('testuser');
            expect(foundUser).toEqual(user);
        });

        it('should return undefined if user not found', async () => {
            (usersService as any).userRepository.findOne.mockResolvedValueOnce(
                undefined,
            );
            const foundUser = await usersService.findOneByUsername('testuser');
            expect(foundUser).toBeUndefined();
        });
    });

    describe('validateCredentials', () => {
        it('should return a user if credentials are valid', async () => {
            const user = new Users();
            user.username = 'testuser';
            user.password = 'password';

            jest.spyOn(usersService, 'comparePasswords');

            (usersService as any).userRepository.findOne.mockResolvedValueOnce(
                user,
            );
            (usersService as any).comparePasswords.mockResolvedValueOnce(true);

            const validatedUser = await usersService.validateCredentials({
                username: 'testuser',
                password: 'password',
            });
            expect(validatedUser).toEqual(user);
        });

        it('should throw a 401 error if user not found', async () => {
            (usersService as any).userRepository.findOne.mockResolvedValueOnce(
                undefined,
            );
            await expect(
                usersService.validateCredentials({
                    username: 'testuser',
                    password: 'password',
                }),
            ).rejects.toThrowError(HttpException);
        });

        it('should throw a 401 error if password is invalid', async () => {
            const user = new Users();
            user.username = 'testuser';
            user.password = 'password';
            (usersService as any).userRepository.findOne.mockResolvedValueOnce(
                user,
            );
            await expect(
                usersService.validateCredentials({
                    username: 'testuser',
                    password: 'incorrect-password',
                }),
            ).rejects.toThrowError(HttpException);
        });
    });

    describe('create', () => {
        it('should create a new user if username is not already in use', async () => {
            const user = new Users();
            user.username = 'testuser';
            user.password = 'password';
            (usersService as any).userRepository.findOne.mockResolvedValueOnce(
                undefined,
            );
            (usersService as any).userRepository.create.mockReturnValue(user);
            const createdUser = await usersService.create({
                username: 'testuser',
                password: 'password',
            });
            expect(createdUser).toEqual(user);
        });

        it('should throw a 400 error if username is already in use', async () => {
            const user = new Users();
            user.username = 'testuser';
            user.password = 'password';
            (usersService as any).userRepository.findOne.mockResolvedValueOnce(
                user,
            );
            await expect(
                usersService.create({
                    username: 'testuser',
                    password: 'password',
                }),
            ).rejects.toThrowError(HttpException);
        });
    });
});
