import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { User } from './user.meta';
import def, { unused } from './user.unused';
@Controller('api/user')
export class UserController {
    @Get('getById')
    public async getUser(
        @Query('id') id: number,
        @Query('name') name: string,
        @Query() all: object,
        uid: number): Promise<User> {
        return null;
    }

    @Post('search')
    public async searchUser(@Body() user: User): Promise<User> {
        return null;
    }

    @Post('add')
    public async addUser(@Body() user: User) {
        return null;
    }
}
