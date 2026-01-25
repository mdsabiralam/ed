await this.rbacCache.invalidateRole(role);
await this.rbacCache.invalidateRole(req.user.role);
await this.rbacCache.invalidateAll();
