import { Controller, Get } from '@nestjs/common';
import { Param } from '../param';
import { User } from './user.meta';

@Controller('api/user')
export class UserController {
    @Get('get')
    public async getUser(@Param('id') id: number): Promise<User> {
        return null;
    }
}
