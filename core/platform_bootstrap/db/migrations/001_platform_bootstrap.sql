-- Plug-1 : Platform Bootstrap & Identity Core
-- Database: PostgreSQL
-- Purpose: Foundation tables for bootstrap context resolution

BEGIN;

-- 1. users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'en',
    voice_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. institutes table
CREATE TABLE IF NOT EXISTS institutes (
    institute_id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subscription_status VARCHAR(30) NOT NULL,
    current_plan VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. institute_subscriptions table
CREATE TABLE IF NOT EXISTS institute_subscriptions (
    id UUID PRIMARY KEY,
    institute_id UUID NOT NULL,
    plan_id VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_institute
        FOREIGN KEY (institute_id)
        REFERENCES institutes(institute_id)
        ON DELETE CASCADE
);

-- 4. plugin_registry table
CREATE TABLE IF NOT EXISTS plugin_registry (
    plugin_key VARCHAR(100) PRIMARY KEY,
    min_plan_required VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
