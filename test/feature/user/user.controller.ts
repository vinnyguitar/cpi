import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Param } from '../param';
import { User } from './user.meta';

@Controller('api/user')
export class UserController {
    @Get('getById')
    public async getUser(@Query('id') id: number, @Query('name') name: string, uid: number): Promise<User> {
        return null;
    }

    @Post('search')
    public async searchUser(@Body() user: User): Promise<User> {
        return null;
    }
}
