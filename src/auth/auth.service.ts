import {
    Injectable,
    InternalServerErrorException,
    UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) {}

    async signIn(username: string, pass: string) {
        const user = await this.usersService.validateCredentials({
            username,
            password: pass,
        });
        if (!user) {
            throw new UnauthorizedException();
        }
        const payload = { sub: user.id, username: user.username };
        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }

    async signUp(username: string, pass: string) {
        const user = await this.usersService.create({
            username,
            password: pass,
        });
        if (!user) {
            throw new InternalServerErrorException();
        }
        delete user.password;
        return user;
    }
}
