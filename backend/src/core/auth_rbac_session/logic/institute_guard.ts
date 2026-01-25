import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class InstituteGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const user = request.user;
    const instituteFromHeader =
      request.headers['x-institute-id'];

    if (!user?.institute_id) {
      throw new ForbiddenException('Institute context missing');
    }

    if (
      instituteFromHeader &&
      instituteFromHeader !== user.institute_id
    ) {
      throw new ForbiddenException(
        'Cross-institute access blocked',
      );
    }

    return true;
  }
}
