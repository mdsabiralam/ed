import { AuthRbacSessionModule } from './auth_rbac_session.module';

export const AuthRbacSessionPlug = {
  key: 'auth_rbac_session',
  dependsOn: ['platform_bootstrap'],
  module: AuthRbacSessionModule,
};
