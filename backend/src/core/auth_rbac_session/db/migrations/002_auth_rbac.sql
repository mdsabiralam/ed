-- 002_auth_rbac.sql
-- Plug-2: Auth, RBAC & Session Control

-- =========================
-- AUTH USERS
-- =========================
CREATE TABLE auth_users (
  user_id        VARCHAR(36) PRIMARY KEY,
  password_hash  TEXT NOT NULL,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- USER ROLES (Multi-Institute)
-- =========================
CREATE TABLE user_roles (
  user_id       VARCHAR(36) NOT NULL,
  role          VARCHAR(50) NOT NULL,
  institute_id  VARCHAR(36) NOT NULL,
  PRIMARY KEY (user_id, role, institute_id)
);

-- =========================
-- SESSIONS (Device Bound)
-- =========================
CREATE TABLE sessions (
  session_id     VARCHAR(36) PRIMARY KEY,
  user_id        VARCHAR(36) NOT NULL,
  device_id      VARCHAR(100) NOT NULL,
  refresh_token  TEXT NOT NULL,
  expires_at     TIMESTAMP NOT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expiry ON sessions(expires_at);

-- =========================
-- ROLE PERMISSIONS
-- =========================
CREATE TABLE role_permissions (
  role        VARCHAR(50) NOT NULL,
  module_key  VARCHAR(100) NOT NULL,
  can_read    BOOLEAN DEFAULT FALSE,
  can_write   BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (role, module_key)
);
