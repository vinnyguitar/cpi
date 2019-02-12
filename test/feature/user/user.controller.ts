import { Controller, Get } from '@nestjs/common';
import { Param } from '../param';
import { User } from './user.meta';

@Controller('api/user')
export class UserController {
    @Get('getById')
    public async getUser(@Param('id') id: number, uid: number): Promise<User> {
        return null;
    }

    @Get('search')
    public async searchUser(@Param() user: User): Promise<User> {
        return null;
    }
}
