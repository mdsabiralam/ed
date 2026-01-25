// core/plug_loader.ts

export interface PlugDefinition {
  key: string;
  dependsOn?: string[];
  module: any;
}

export class PlugLoader {
  private registry = new Map<string, PlugDefinition>();

  register(plug: PlugDefinition) {
    if (this.registry.has(plug.key)) {
      throw new Error(`Plug already registered: ${plug.key}`);
    }
    this.registry.set(plug.key, plug);
  }

  resolve(): PlugDefinition[] {
    const resolved: PlugDefinition[] = [];
    const visited = new Set<string>();

    const visit = (key: string, stack: string[] = []) => {
      if (visited.has(key)) return;

      const plug = this.registry.get(key);
      if (!plug) {
        throw new Error(`Missing dependency plug: ${key}`);
      }

      if (stack.includes(key)) {
        throw new Error(
          `Circular dependency detected: ${stack.join(' -> ')} -> ${key}`,
        );
      }

      for (const dep of plug.dependsOn || []) {
        visit(dep, [...stack, key]);
      }

      visited.add(key);
      resolved.push(plug);
    };

    for (const key of this.registry.keys()) {
      visit(key);
    }

    return resolved;
  }
}

/**
 * Singleton loader instance
 * ⚠️ MUST be declared BEFORE any register() call
 */
export const plugLoader = new PlugLoader();

/* ---------------------------------------
   Plug registrations MUST come AFTER this
---------------------------------------- */

import { AuthRbacSessionPlug } from './auth_rbac_session';

plugLoader.register(AuthRbacSessionPlug);
