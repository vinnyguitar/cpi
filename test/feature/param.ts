import { createParamDecorator } from '@nestjs/common';

export const Param = createParamDecorator((data, req) => {
    const param = { ...req.query, ...req.body, ...req.param };
    return data ? param[data] : param;
});
