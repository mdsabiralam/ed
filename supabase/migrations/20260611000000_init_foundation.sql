-- SQL Migration: 20260611000000_init_foundation.sql
-- Description: Init foundation schemas, tables, relationships, and Row Level Security (RLS) policies.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. BASE MODULES, PLANS & FEATURE REGISTRY
-- =========================================================================

-- 1.1 Plans Table
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL, -- e.g., "SILVER", "GOLD", "PLATINUM", "ENTERPRISE"
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    billing_cycle VARCHAR(50) NOT NULL DEFAULT 'MONTHLY', -- MONTHLY, YEARLY
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

-- 1.2 Plan Features mapping
CREATE TABLE plan_features (
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    feature_key VARCHAR(100) NOT NULL, -- e.g., "admission", "attendance", "finance", "ai_attendance"
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (plan_id, feature_key)
);

-- 1.3 Institutes Table (Tenant)
CREATE TABLE institutes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    subscription_status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, TRIAL, PAST_DUE, CANCELED, EXPIRED
    expiry_date TIMESTAMPTZ,
    grace_period_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

-- 1.4 Branches Table (Sub-tenant)
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

-- =========================================================================
-- 2. ACADEMIC & FINANCIAL PERIODS, SEQUENCES & INFRASTRUCTURE
-- =========================================================================

-- 2.1 Academic Sessions Table
CREATE TABLE academic_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g. "2025-26", "2026-27"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

-- 2.2 Financial Years Table
CREATE TABLE financial_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g. "FY 2025-26", "FY 2026-27"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

-- 2.3 Number Sequence Generator
CREATE TABLE number_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    sequence_type VARCHAR(100) NOT NULL, -- ADMISSION, EMPLOYEE, INVOICE, RECEIPT, CERTIFICATE, IDCARD
    prefix VARCHAR(50),
    current_number INT NOT NULL DEFAULT 1,
    suffix VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_sequence_type_institute UNIQUE (sequence_type, institute_id)
);

-- 2.4 Job Queue Logs Table
CREATE TABLE job_queue_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    job_type VARCHAR(100) NOT NULL,
    queue_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
    payload_json JSONB,
    result_json JSONB,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5 API Keys Table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    api_key_hash VARCHAR(255) UNIQUE NOT NULL,
    permissions_json JSONB,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.6 Webhook Logs Table
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    source VARCHAR(100) NOT NULL, -- RAZORPAY, STRIPE, WHATSAPP, SMS_GATEWAY, AI_SERVICES
    event_name VARCHAR(100) NOT NULL,
    payload_json JSONB,
    status VARCHAR(50) NOT NULL,
    response_code INT,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.7 Export Jobs Table
CREATE TABLE export_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    export_type VARCHAR(100) NOT NULL, -- STUDENT, FINANCE, PAYROLL, BACKUP
    file_url TEXT,
    requested_by UUID NOT NULL, -- references users(id) later in schema definition
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.8 Countries Table (Global Expansion)
CREATE TABLE countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    iso_code VARCHAR(10) UNIQUE NOT NULL, -- e.g. "US", "BD", "IN"
    phone_code VARCHAR(10), -- e.g. "+1", "+880"
    currency_code VARCHAR(10), -- e.g. "USD", "BDT"
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.9 States Table (Global Expansion)
CREATE TABLE states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10), -- e.g. "NY", "DH"
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.10 Cities Table (Global Expansion)
CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state_id UUID NOT NULL REFERENCES states(id) ON DELETE CASCADE,
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 3. USERS, ROLES & SEPARATED PROFILE SCHEMAS
-- =========================================================================

-- 3.1 Base Users Table (Identity credentials only)
-- Fix 1: Email uniqueness scoped per tenant (institute_id, email)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    CONSTRAINT uq_user_email_institute UNIQUE (institute_id, email)
);

-- Alter export_jobs table to add reference user relation safely
ALTER TABLE export_jobs ADD CONSTRAINT fk_export_user FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE;

-- 3.2 Guardians Table (Parent/Guardian Profile)
CREATE TABLE guardians (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    relation_to_student VARCHAR(50), -- FATHER, MOTHER, GUARDIAN, etc.
    occupation VARCHAR(150),
    emergency_phone VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

-- 3.3 Students Table (Student Profile)
-- Fix 2: Changed class_id (UUID) to class_name/section_name for self-containment
CREATE TABLE students (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    roll_number VARCHAR(50),
    admission_number VARCHAR(100) NOT NULL,
    class_name VARCHAR(100),
    section_name VARCHAR(100),
    guardian_id UUID REFERENCES guardians(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    CONSTRAINT uq_student_admission UNIQUE (institute_id, admission_number)
);

-- 3.4 Drivers Table (Driver Profile)
CREATE TABLE drivers (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    license_number VARCHAR(100) NOT NULL,
    license_expiry DATE,
    vehicle_number VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

-- 3.5 Staff Profiles Table (Teacher/Staff Profile)
CREATE TABLE staff_profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    designation VARCHAR(100) NOT NULL, -- e.g., TEACHER, PRINCIPAL, ACCOUNTANT
    department VARCHAR(100),
    joining_date DATE,
    qualification TEXT,
    salary NUMERIC(12, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

-- 3.6 Roles Table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    CONSTRAINT uq_role_name_institute UNIQUE (name, institute_id)
);

-- 3.7 Permissions Table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) UNIQUE NOT NULL, -- e.g., "users.create", "fees.collect"
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.8 Role-Permissions Join Table
CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 3.9 User-Roles Join Table (Supports multi-role, branch-specific access)
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- =========================================================================
-- 4. AUTHENTICATION & LOGIN SESSIONS
-- =========================================================================

-- 4.1 Refresh Tokens Table
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.2 Login Sessions Table
CREATE TABLE login_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(50),
    device_info TEXT,
    browser VARCHAR(100),
    os VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.3 Password Reset Tokens Table
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 5. SAAS SUBSCRIPTIONS & BILLING
-- =========================================================================

-- 5.1 Institute Subscriptions Table
CREATE TABLE institute_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL, -- ACTIVE, TRIAL, PAST_DUE, CANCELED, EXPIRED
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    trial_ends_at TIMESTAMPTZ,
    billing_cycle VARCHAR(50) NOT NULL, -- MONTHLY, YEARLY
    amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

-- 5.2 Subscription Invoices Table
CREATE TABLE subscription_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES institute_subscriptions(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL, -- PAID, UNPAID, VOID, REFUNDED
    due_date TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 6. AUDIT LOGGING (Declarative Monthly Partitioning)
-- =========================================================================

-- 6.1 Audit Logs parent table partitioned by RANGE of created_at
CREATE TABLE audit_logs (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    institute_id UUID,
    branch_id UUID,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    ip_address VARCHAR(50),
    device_info TEXT,
    browser VARCHAR(100),
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Fix 4: Added dynamic PL/pgSQL function to pre-generate audit partitions (Automated Creator)
CREATE OR REPLACE FUNCTION create_audit_log_partitions()
RETURNS void AS $$
DECLARE
    next_month DATE;
    partition_name TEXT;
    start_date TEXT;
    end_date TEXT;
BEGIN
    FOR i IN 0..2 LOOP
        next_month := DATE_TRUNC('month', CURRENT_DATE + (i || ' month')::INTERVAL);
        partition_name := 'audit_logs_y' || TO_CHAR(next_month, 'YYYY') || 'm' || TO_CHAR(next_month, 'MM');
        start_date := TO_CHAR(next_month, 'YYYY-MM-01 00:00:00+00');
        end_date := TO_CHAR(next_month + '1 month'::INTERVAL, 'YYYY-MM-01 00:00:00+00');
        
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = partition_name
              AND n.nspname = 'public'
        ) THEN
            EXECUTE FORMAT('CREATE TABLE %I PARTITION OF audit_logs FOR VALUES FROM (%L) TO (%L)', 
                           partition_name, start_date, end_date);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger partition initialization on migration setup
SELECT create_audit_log_partitions();

-- 6.2 Default partition to catch out-of-range logs gracefully
CREATE TABLE audit_logs_default PARTITION OF audit_logs DEFAULT;

-- 6.3 Activities Table (Timeline Engine)
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    activity_type VARCHAR(100) NOT NULL, -- e.g., "STUDENT_CREATION", "FEE_COLLECTION"
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 7. MEDIA, STORAGE, SETTINGS & SYSTEM CONFIGS
-- =========================================================================

-- 7.1 Media Files Table
CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

-- 7.2 Settings Table (Tenant Level Settings)
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_settings_key_tenant UNIQUE (key, institute_id, branch_id)
);

-- 7.3 System Configs Table (Global Level SaaS Configurations)
CREATE TABLE system_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 8. NOTIFICATIONS SCHEMAS
-- =========================================================================

-- 8.1 Notification Templates Table
-- Fix 3: Scoped name uniqueness per channel (name, channel)
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL, -- e.g., "welcome", "fee_due"
    subject VARCHAR(255),
    body TEXT NOT NULL,
    channel VARCHAR(50) NOT NULL, -- EMAIL, SMS, WHATSAPP, PUSH
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_notification_template_name_channel UNIQUE (name, channel)
);

-- 8.2 Notifications Log Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES notification_templates(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    channel VARCHAR(50) NOT NULL, -- EMAIL, SMS, WHATSAPP, PUSH
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, SENT, FAILED, READ
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8.3 Notification Devices Table (Firebase FCM Registration Tokens)
CREATE TABLE notification_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    device_type VARCHAR(50) NOT NULL, -- IOS, ANDROID, WEB
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_device_token UNIQUE (user_id, device_token)
);

-- =========================================================================
-- 9. FEATURE FLAGS, MODULES & AI JOBS
-- =========================================================================

-- 9.1 Feature Flags Table
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE, -- NULL means global system-wide default
    flag_key VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_flag_key_institute UNIQUE (flag_key, institute_id)
);

-- 9.2 Modules Table (Module Registry)
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9.3 AI Jobs Queue
CREATE TABLE ai_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    job_type VARCHAR(100) NOT NULL, -- OCR, FACE_RECOGNITION, TIMETABLE_GEN, ATTENDANCE_AI
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
    input_json JSONB,
    output_json JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 10. INDEXES DEFINITIONS
-- =========================================================================
CREATE INDEX idx_users_institute ON users(institute_id);
CREATE INDEX idx_users_branch ON users(branch_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_students_admission ON students(admission_number);
CREATE INDEX idx_students_institute ON students(institute_id);
CREATE INDEX idx_students_branch ON students(branch_id);
CREATE INDEX idx_students_guardian ON students(guardian_id);
CREATE INDEX idx_guardians_institute ON guardians(institute_id);
CREATE INDEX idx_drivers_institute ON drivers(institute_id);
CREATE INDEX idx_staff_institute ON staff_profiles(institute_id);
CREATE INDEX idx_staff_branch ON staff_profiles(branch_id);
CREATE INDEX idx_branches_institute ON branches(institute_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_audit_logs_institute ON audit_logs(institute_id);
CREATE INDEX idx_media_files_institute ON media_files(institute_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_activities_institute ON activities(institute_id);
CREATE INDEX idx_ai_jobs_institute ON ai_jobs(institute_id);
CREATE INDEX idx_login_sessions_user ON login_sessions(user_id);
CREATE INDEX idx_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_subscriptions_institute ON institute_subscriptions(institute_id);
CREATE INDEX idx_invoices_institute ON subscription_invoices(institute_id);
CREATE INDEX idx_devices_user ON notification_devices(user_id);
CREATE INDEX idx_settings_key ON settings(key);
CREATE INDEX idx_academic_sessions_institute ON academic_sessions(institute_id);
CREATE INDEX idx_financial_years_institute ON financial_years(institute_id);
CREATE INDEX idx_number_sequences_institute ON number_sequences(institute_id);
CREATE INDEX idx_job_queue_logs_institute ON job_queue_logs(institute_id);
CREATE INDEX idx_api_keys_institute ON api_keys(institute_id);
CREATE INDEX idx_webhook_logs_institute ON webhook_logs(institute_id);
CREATE INDEX idx_export_jobs_institute ON export_jobs(institute_id);
CREATE INDEX idx_states_country ON states(country_id);
CREATE INDEX idx_cities_state ON cities(state_id);
CREATE INDEX idx_cities_country ON cities(country_id);

-- =========================================================================
-- 11. HELPER FUNCTIONS FOR TENANT CONTEXT
-- =========================================================================

CREATE OR REPLACE FUNCTION get_current_institute_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_institute_id', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS VARCHAR AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_role', true), '');
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tenant-specific and global tables
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE number_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_queue_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE institute_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;

-- 12.1 RLS Policies: plans & plan_features
CREATE POLICY plan_read_policy ON plans FOR SELECT USING (true);
CREATE POLICY plan_write_policy ON plans FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN');

CREATE POLICY plan_features_read_policy ON plan_features FOR SELECT USING (true);
CREATE POLICY plan_features_write_policy ON plan_features FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN');

-- 12.2 RLS Policies: institutes
CREATE POLICY institute_access_policy ON institutes
    FOR ALL
    USING (
        get_current_user_role() = 'SUPER_ADMIN'
        OR id = get_current_institute_id()
    );

-- 12.3 RLS Policies: branches
CREATE POLICY branch_access_policy ON branches
    FOR ALL
    USING (
        get_current_user_role() = 'SUPER_ADMIN'
        OR institute_id = get_current_institute_id()
    );

-- 12.4 RLS Policies: academic_sessions, financial_years, number_sequences, job_queue_logs, api_keys, webhook_logs, export_jobs
CREATE POLICY academic_session_access_policy ON academic_sessions FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());
CREATE POLICY financial_year_access_policy ON financial_years FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());
CREATE POLICY number_sequence_access_policy ON number_sequences FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());
CREATE POLICY job_queue_logs_access_policy ON job_queue_logs FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());
CREATE POLICY api_keys_access_policy ON api_keys FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());
CREATE POLICY webhook_logs_access_policy ON webhook_logs FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());
CREATE POLICY export_jobs_access_policy ON export_jobs FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());

-- 12.5 RLS Policies: countries, states, cities (Global tables readable by all, modified by SUPER_ADMIN)
CREATE POLICY countries_read_policy ON countries FOR SELECT USING (true);
CREATE POLICY countries_write_policy ON countries FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN');

CREATE POLICY states_read_policy ON states FOR SELECT USING (true);
CREATE POLICY states_write_policy ON states FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN');

CREATE POLICY cities_read_policy ON cities FOR SELECT USING (true);
CREATE POLICY cities_write_policy ON cities FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN');

-- 12.6 RLS Policies: users
CREATE POLICY user_access_policy ON users
    FOR ALL
    USING (
        get_current_user_role() = 'SUPER_ADMIN'
        OR institute_id = get_current_institute_id()
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- 12.7 RLS Policies: Profiles (guardians, students, drivers, staff_profiles)
CREATE POLICY guardian_access_policy ON guardians FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());
CREATE POLICY student_access_policy ON students FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());
CREATE POLICY driver_access_policy ON drivers FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());
CREATE POLICY staff_access_policy ON staff_profiles FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());

-- 12.8 RLS Policies: roles & permissions
CREATE POLICY role_access_policy ON roles
    FOR ALL
    USING (
        get_current_user_role() = 'SUPER_ADMIN'
        OR institute_id IS NULL -- Global system roles
        OR institute_id = get_current_institute_id()
    );

CREATE POLICY role_permissions_access_policy ON role_permissions
    FOR ALL
    USING (
        get_current_user_role() = 'SUPER_ADMIN'
        OR EXISTS (
            SELECT 1 FROM roles 
            WHERE roles.id = role_permissions.role_id 
              AND (roles.institute_id IS NULL OR roles.institute_id = get_current_institute_id())
        )
    );

-- 12.9 RLS Policies: user_roles
CREATE POLICY user_roles_access_policy ON user_roles
    FOR ALL
    USING (
        get_current_user_role() = 'SUPER_ADMIN'
        OR institute_id = get_current_institute_id()
    );

-- 12.10 RLS Policies: refresh_tokens, login_sessions, password_reset_tokens
CREATE POLICY refresh_tokens_access_policy ON refresh_tokens
    FOR ALL
    USING (
        get_current_user_role() = 'SUPER_ADMIN'
        OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = refresh_tokens.user_id
              AND users.institute_id = get_current_institute_id()
        )
    );

CREATE POLICY login_sessions_access_policy ON login_sessions
    FOR ALL
    USING (
        get_current_user_role() = 'SUPER_ADMIN'
        OR institute_id = get_current_institute_id()
    );

CREATE POLICY password_reset_tokens_access_policy ON password_reset_tokens
    FOR ALL
    USING (
        get_current_user_role() = 'SUPER_ADMIN'
        OR institute_id = get_current_institute_id()
    );

-- 12.11 RLS Policies: subscriptions & invoices
CREATE POLICY subscription_access_policy ON institute_subscriptions
    FOR ALL
    USING (
        get_current_user_role() = 'SUPER_ADMIN'
        OR institute_id = get_current_institute_id()
    );

CREATE POLICY invoice_access_policy ON subscription_invoices
    FOR ALL
    USING (
        get_current_user_role() = 'SUPER_ADMIN'
        OR institute_id = get_current_institute_id()
    );

-- 12.12 RLS Policies: audit_logs & activities
CREATE POLICY audit_logs_access_policy ON audit_logs
    FOR ALL
    USING (
        get_current_user_role() = 'SUPER_ADMIN'
        OR institute_id = get_current_institute_id()
    );

CREATE POLICY activities_access_policy ON activities
    FOR ALL
    USING (
        get_current_user_role() = 'SUPER_ADMIN'
        OR institute_id = get_current_institute_id()
    );

-- 12.13 RLS Policies: media_files & settings
CREATE POLICY media_files_access_policy ON media_files FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());
CREATE POLICY settings_access_policy ON settings FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());

-- 12.14 RLS Policies: system_configs (Publicly readable, writable only by SUPER_ADMIN)
CREATE POLICY system_configs_read ON system_configs FOR SELECT USING (true);
CREATE POLICY system_configs_write ON system_configs FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN');

-- 12.15 RLS Policies: notifications & devices
CREATE POLICY notifications_access_policy ON notifications FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());
CREATE POLICY notification_devices_access_policy ON notification_devices FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());

-- 12.16 RLS Policies: feature_flags & ai_jobs
CREATE POLICY feature_flags_access_policy ON feature_flags
    FOR ALL
    USING (
        get_current_user_role() = 'SUPER_ADMIN'
        OR institute_id IS NULL
        OR institute_id = get_current_institute_id()
    );

CREATE POLICY ai_jobs_access_policy ON ai_jobs FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());


-- =========================================================================
-- 13. INITIAL SEED DATA
-- =========================================================================

-- 13.1 Seed Subscription Plans
INSERT INTO plans (id, name, price, billing_cycle) VALUES
    ('1b3e792b-8fd1-4bc9-bb11-42e1329c0fa1', 'SILVER', 99.00, 'MONTHLY'),
    ('2b3e792b-8fd1-4bc9-bb11-42e1329c0fa2', 'GOLD', 199.00, 'MONTHLY'),
    ('3b3e792b-8fd1-4bc9-bb11-42e1329c0fa3', 'DIAMOND', 399.00, 'MONTHLY');

-- 13.2 Seed Plan Features
INSERT INTO plan_features (plan_id, feature_key, is_enabled) VALUES
    ('1b3e792b-8fd1-4bc9-bb11-42e1329c0fa1', 'admission', TRUE),
    ('1b3e792b-8fd1-4bc9-bb11-42e1329c0fa1', 'attendance', TRUE),
    ('1b3e792b-8fd1-4bc9-bb11-42e1329c0fa1', 'finance', FALSE),
    ('1b3e792b-8fd1-4bc9-bb11-42e1329c0fa1', 'ai_attendance', FALSE);

INSERT INTO plan_features (plan_id, feature_key, is_enabled) VALUES
    ('2b3e792b-8fd1-4bc9-bb11-42e1329c0fa2', 'admission', TRUE),
    ('2b3e792b-8fd1-4bc9-bb11-42e1329c0fa2', 'attendance', TRUE),
    ('2b3e792b-8fd1-4bc9-bb11-42e1329c0fa2', 'finance', TRUE),
    ('2b3e792b-8fd1-4bc9-bb11-42e1329c0fa2', 'ai_attendance', FALSE);

INSERT INTO plan_features (plan_id, feature_key, is_enabled) VALUES
    ('3b3e792b-8fd1-4bc9-bb11-42e1329c0fa3', 'admission', TRUE),
    ('3b3e792b-8fd1-4bc9-bb11-42e1329c0fa3', 'attendance', TRUE),
    ('3b3e792b-8fd1-4bc9-bb11-42e1329c0fa3', 'finance', TRUE),
    ('3b3e792b-8fd1-4bc9-bb11-42e1329c0fa3', 'ai_attendance', TRUE);

-- 13.3 Permissions Registry
INSERT INTO permissions (name, description) VALUES
    ('institutes.create', 'Create new institutes (Super Admin only)'),
    ('institutes.read', 'Read institute details'),
    ('institutes.update', 'Update institute settings'),
    ('institutes.delete', 'Soft delete institutes'),
    ('branches.create', 'Create branches'),
    ('branches.read', 'Read branch information'),
    ('branches.update', 'Update branch details'),
    ('branches.delete', 'Soft delete branches'),
    ('users.create', 'Register and onboard new staff/students/teachers'),
    ('users.read', 'View profiles and listings of users'),
    ('users.update', 'Update user records'),
    ('users.delete', 'Soft delete users'),
    ('roles.manage', 'Create and assign custom permissions to roles'),
    ('audit.read', 'View security audit logs for the institute'),
    ('media.upload', 'Upload documents and image media'),
    ('media.delete', 'Delete documents and image media'),
    ('feature_flags.manage', 'Toggle subscription feature components'),
    ('notifications.send', 'Broadcast notifications across SMS/Email/Push'),
    ('notifications.read', 'Read personal or tenant notifications'),
    ('students.create', 'Onboard new students'),
    ('students.read', 'Read student profiles'),
    ('students.update', 'Modify student registry data'),
    ('students.delete', 'Soft delete student profiles'),
    ('fees.create', 'Create fee definitions and configurations'),
    ('fees.read', 'Read fee registry profiles'),
    ('fees.collect', 'Collect fees and log receipts'),
    ('ai_jobs.create', 'Dispatch new background AI jobs'),
    ('ai_jobs.read', 'Read AI processing status logs'),
    ('subscriptions.manage', 'Manage subscription settings and billing'),
    ('settings.manage', 'Modify institute-wide configuration settings'),
    ('academic_sessions.manage', 'Manage institute academic school sessions'),
    ('financial_years.manage', 'Manage accounting financial year ranges'),
    ('number_sequences.manage', 'Configure sequence rules for IDs/invoices'),
    ('api_keys.manage', 'Create and revoke third party integration API keys'),
    ('export_jobs.manage', 'Request data backups and spreadsheet exports'),
    ('regions.manage', 'Configure states and countries directory (Super Admin only)');

-- 13.4 Global Default System Roles
INSERT INTO roles (id, name, description, institute_id) VALUES
    ('8a3e792b-8fd1-4bc9-bb11-42e1329c0f99', 'SUPER_ADMIN', 'Global System Super Administrator', NULL),
    ('9b3e792b-8fd1-4bc9-bb11-42e1329c0f00', 'INSTITUTE_OWNER', 'Owner and billing administrator of the institute', NULL),
    ('ab3e792b-8fd1-4bc9-bb11-42e1329c0f11', 'PRINCIPAL', 'Principal of the institute branch or headquarters', NULL),
    ('bb3e792b-8fd1-4bc9-bb11-42e1329c0f22', 'TEACHER', 'Academic teachers of classrooms and courses', NULL),
    ('cb3e792b-8fd1-4bc9-bb11-42e1329c0f33', 'STAFF', 'Administrative staff management', NULL),
    ('db3e792b-8fd1-4bc9-bb11-42e1329c0f44', 'STUDENT', 'Enrolled student accounts', NULL),
    ('eb3e792b-8fd1-4bc9-bb11-42e1329c0f55', 'PARENT', 'Parents and guardians of students', NULL),
    ('fb3e792b-8fd1-4bc9-bb11-42e1329c0f66', 'DRIVER', 'Transit drivers for student transport', NULL);

-- 13.5 Assign Super Admin permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '8a3e792b-8fd1-4bc9-bb11-42e1329c0f99', id FROM permissions;

-- Assign Institute Owner permissions (All except global management)
INSERT INTO role_permissions (role_id, permission_id)
SELECT '9b3e792b-8fd1-4bc9-bb11-42e1329c0f00', id FROM permissions 
WHERE name NOT IN ('institutes.create', 'institutes.delete', 'feature_flags.manage', 'regions.manage');

-- 13.6 Populate Module Registry
INSERT INTO modules (name, code, description) VALUES
    ('Admission Registry', 'admission', 'Manage student admissions, onboardings, and registries'),
    ('Attendance Engine', 'attendance', 'Manage daily attendance registries for students and staff'),
    ('Finance & Fees', 'finance', 'Fee structuring, collection receipts, ledger logs'),
    ('Human Resources', 'hr', 'Staff management, payouts, rosters, contracts'),
    ('Library Management', 'library', 'Book issues, return registries, catalog search'),
    ('Transit & Transport', 'transport', 'Rosters, routes, drivers, and GPS tracking');
