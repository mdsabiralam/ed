import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { RbacService } from './logic/rbac.service';
import { PermissionsGuard } from './permission.guard';

// Manual mocks
const createMockExecutionContext = (request: any): ExecutionContext => ({
  switchToHttp: () => ({
    getRequest: () => request,
  }),
  getHandler: () => ({}),
  getClass: () => ({}),
  switchToRpc: jest.fn(),
  switchToWs: jest.fn(),
  getType: jest.fn(),
  getArgByIndex: jest.fn(),
});

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let rbacService: RbacService;

  const mockRbacService = {
    hasPermission: jest.fn(),
  };

  const mockReflector = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: RbacService,
          useValue: mockRbacService,
        },
      ],
    }).compile();

    guard = moduleRef.get<PermissionsGuard>(PermissionsGuard);
    reflector = moduleRef.get<Reflector>(Reflector);
    rbacService = moduleRef.get<RbacService>(RbacService);
    
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access if no permissions are required', async () => {
    mockReflector.get.mockReturnValue(null);
    const context = createMockExecutionContext({});
    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should deny access if there is no user', async () => {
    mockReflector.get.mockReturnValue({ moduleKey: 'test', action: 'read' });
    const context = createMockExecutionContext({});
    expect(await guard.canActivate(context)).toBe(false);
  });
  
  it('should deny access if the user has no role', async () => {
    mockReflector.get.mockReturnValue({ moduleKey: 'test', action: 'read' });
    const context = createMockExecutionContext({ user: {} });
    expect(await guard.canActivate(context)).toBe(false);
  });

  it('should call rbacService.hasPermission with correct arguments', async () => {
    const requiredPermissions = { moduleKey: 'dashboard', action: 'write' as const };
    const user = { id: 1, role: 'admin' };
    
    mockReflector.get.mockReturnValue(requiredPermissions);
    const context = createMockExecutionContext({ user });

    await guard.canActivate(context);

    expect(rbacService.hasPermission).toHaveBeenCalledWith(
      user.role,
      requiredPermissions.moduleKey,
      requiredPermissions.action,
    );
  });

  it('should allow access if rbacService.hasPermission returns true', async () => {
    mockReflector.get.mockReturnValue({ moduleKey: 'test', action: 'read' });
    mockRbacService.hasPermission.mockResolvedValue(true);
    const context = createMockExecutionContext({ user: { role: 'admin' } });
    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should deny access if rbacService.hasPermission returns false', async () => {
    mockReflector.get.mockReturnValue({ moduleKey: 'test', action: 'write' });
    mockRbacService.hasPermission.mockResolvedValue(false);
    const context = createMockExecutionContext({ user: { role: 'teacher' } });
    expect(await guard.canActivate(context)).toBe(false);
  });
});
