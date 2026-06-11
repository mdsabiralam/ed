import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestContextUser {
  userId: string;
  email: string;
  instituteId: string;
  branchId: string | null;
  roles: string[];
  permissions: string[];
}

export const CurrentUser = createParamDecorator(
  (data: keyof RequestContextUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as RequestContextUser | undefined;

    return data && user ? user[data] : user;
  },
);
