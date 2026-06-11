-- SQL Migration: 20260611000001_admission_module.sql
-- Description: Provision Module 02 (Student Admission & Lead Management) tables, native enums, indices, and RLS policies.

-- =========================================================================
-- 1. NATIVE ENUM DEFINITIONS
-- =========================================================================

CREATE TYPE lead_status AS ENUM ('NEW', 'CONTACTED', 'FOLLOW_UP', 'VISITED', 'APPLICATION_STARTED', 'APPLICATION_SUBMITTED', 'LOST');
CREATE TYPE application_status AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'DOCUMENT_PENDING', 'EXAM_SCHEDULED', 'INTERVIEW_SCHEDULED', 'WAITLISTED', 'APPROVED', 'REJECTED', 'MATRICULATED');
CREATE TYPE document_verification_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE exam_result_status AS ENUM ('PENDING', 'PASSED', 'FAILED');
CREATE TYPE interview_result_status AS ENUM ('PENDING', 'RECOMMENDED', 'NOT_RECOMMENDED');
CREATE TYPE fee_ledger_status AS ENUM ('CLEARED', 'OVERDUE', 'PARTIALLY_PAID');
CREATE TYPE fee_ledger_item_status AS ENUM ('UNPAID', 'PAID', 'PARTIALLY_PAID');
CREATE TYPE admission_approval_action AS ENUM ('SUBMIT', 'REVIEW', 'EXAM_SCHEDULED', 'INTERVIEW_SCHEDULED', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE ocr_job_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- Upgraded Domain Enums
CREATE TYPE admission_session_status AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'SUSPENDED');
CREATE TYPE document_type AS ENUM ('BIRTH_CERTIFICATE', 'AADHAAR_CARD', 'TRANSFER_CERTIFICATE', 'MARKSHEET', 'PHOTOGRAPH', 'ADDRESS_PROOF', 'OTHER');
CREATE TYPE admission_fee_type AS ENUM ('ADMISSION_FEE', 'REGISTRATION_FEE', 'PROSPECTUS_FEE', 'TUITION_FEE', 'TRANSPORT_FEE', 'OTHER');
CREATE TYPE seat_status AS ENUM ('AVAILABLE', 'FULL', 'OVERFLOW');

-- =========================================================================
-- 2. BASELINE TABLES: ADMISSION CYCLES & LEADS
-- =========================================================================

CREATE TABLE admission_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    academic_session_id UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status admission_session_status NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    admission_session_id UUID NOT NULL REFERENCES admission_sessions(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    class_name VARCHAR(100),
    status lead_status NOT NULL DEFAULT 'NEW',
    source VARCHAR(100) DEFAULT 'WEBSITE',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

-- =========================================================================
-- 3. UPGRADE TABLES: LEAD CRM FOLLOWUPS & DYNAMIC FORMS
-- =========================================================================

CREATE TABLE lead_followups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    followed_up_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    follow_up_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    next_follow_up_date TIMESTAMPTZ,
    mode VARCHAR(50) NOT NULL DEFAULT 'CALL', -- CALL, EMAIL, VISIT, WHATSAPP
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admission_form_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1,
    form_fields_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

-- =========================================================================
-- 4. BASELINE TABLES: ADMISSION APPLICATIONS
-- =========================================================================

CREATE TABLE admission_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    admission_session_id UUID NOT NULL REFERENCES admission_sessions(id) ON DELETE CASCADE,
    application_number VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(50),
    class_name VARCHAR(100) NOT NULL,
    section_name VARCHAR(100),
    guardian_first_name VARCHAR(100) NOT NULL,
    guardian_last_name VARCHAR(100) NOT NULL,
    guardian_email VARCHAR(255) NOT NULL,
    guardian_phone VARCHAR(50) NOT NULL,
    guardian_relation VARCHAR(50) NOT NULL,
    guardian_occupation VARCHAR(150),
    guardian_id UUID REFERENCES guardians(id) ON DELETE SET NULL,
    status application_status NOT NULL DEFAULT 'SUBMITTED',
    waitlist_number INT,
    is_reserved BOOLEAN DEFAULT FALSE,
    custom_fields_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

CREATE TABLE admission_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES admission_applications(id) ON DELETE CASCADE,
    document_type document_type NOT NULL,
    file_url TEXT NOT NULL,
    verification_status document_verification_status NOT NULL DEFAULT 'PENDING',
    rejected_reason TEXT,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

-- =========================================================================
-- 5. BASELINE TABLES: EVALUATIONS
-- =========================================================================

CREATE TABLE entrance_exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    application_id UUID NOT NULL UNIQUE REFERENCES admission_applications(id) ON DELETE CASCADE,
    exam_date TIMESTAMPTZ NOT NULL,
    max_marks NUMERIC(5, 2),
    marks_obtained NUMERIC(5, 2),
    result_status exam_result_status NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

CREATE TABLE admission_interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    application_id UUID NOT NULL UNIQUE REFERENCES admission_applications(id) ON DELETE CASCADE,
    interview_date TIMESTAMPTZ NOT NULL,
    interviewer_name VARCHAR(150) NOT NULL,
    feedback TEXT,
    result_status interview_result_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

-- =========================================================================
-- 6. UPGRADE TABLES: SEAT MANAGEMENT, WORKFLOW LOGS & AI OCR JOBS
-- =========================================================================

CREATE TABLE class_seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    academic_session_id UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
    class_name VARCHAR(100) NOT NULL,
    section_name VARCHAR(100),
    capacity INT NOT NULL,
    reserved_seats INT NOT NULL DEFAULT 0,
    admitted_seats INT NOT NULL DEFAULT 0,
    status seat_status NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    CONSTRAINT uq_class_seat_session UNIQUE (institute_id, academic_session_id, class_name, section_name)
);

CREATE TABLE admission_approval_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES admission_applications(id) ON DELETE CASCADE,
    action admission_approval_action NOT NULL,
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ocr_admission_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    application_id UUID REFERENCES admission_applications(id) ON DELETE CASCADE,
    document_id UUID REFERENCES admission_documents(id) ON DELETE CASCADE,
    status ocr_job_status NOT NULL DEFAULT 'PENDING',
    extracted_data_json JSONB,
    error_message TEXT,
    confidence_score NUMERIC(5, 2),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 7. BASELINE TABLES: FEE LEDGER INITIALIZATION
-- =========================================================================

CREATE TABLE fee_ledgers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    student_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    total_due NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status fee_ledger_status NOT NULL DEFAULT 'CLEARED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

CREATE TABLE fee_ledger_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    ledger_id UUID NOT NULL REFERENCES fee_ledgers(id) ON DELETE CASCADE,
    fee_type admission_fee_type NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status fee_ledger_item_status NOT NULL DEFAULT 'UNPAID',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

-- =========================================================================
-- 8. SECURITY (ROW LEVEL SECURITY - RLS)
-- =========================================================================

ALTER TABLE admission_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrance_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_approval_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_admission_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_ledger_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY admission_sessions_policy ON admission_sessions FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());
CREATE POLICY leads_policy ON leads FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());
CREATE POLICY lead_followups_policy ON lead_followups FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());
CREATE POLICY admission_form_templates_policy ON admission_form_templates FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());
CREATE POLICY admission_applications_policy ON admission_applications FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());
CREATE POLICY admission_documents_policy ON admission_documents FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());
CREATE POLICY entrance_exams_policy ON entrance_exams FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());
CREATE POLICY admission_interviews_policy ON admission_interviews FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());
CREATE POLICY class_seats_policy ON class_seats FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());
CREATE POLICY admission_approval_logs_policy ON admission_approval_logs FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());
CREATE POLICY ocr_admission_jobs_policy ON ocr_admission_jobs FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());
CREATE POLICY fee_ledgers_policy ON fee_ledgers FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());
CREATE POLICY fee_ledger_items_policy ON fee_ledger_items FOR ALL USING (get_current_user_role() = 'SUPER_ADMIN' OR institute_id = get_current_institute_id());

-- =========================================================================
-- 9. PERFORMANCE INDEXES (PATCHED WITH COMPOUND SAAS FILTERS)
-- =========================================================================

CREATE INDEX idx_admission_sessions_institute ON admission_sessions(institute_id);
CREATE INDEX idx_leads_institute ON leads(institute_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_session ON leads(admission_session_id);
CREATE INDEX idx_lead_followups_lead ON lead_followups(lead_id);
CREATE INDEX idx_form_templates_class ON admission_form_templates(institute_id, class_name);
CREATE INDEX idx_applications_institute ON admission_applications(institute_id);
CREATE INDEX idx_applications_status ON admission_applications(status);
CREATE INDEX idx_applications_session ON admission_applications(admission_session_id);
CREATE INDEX idx_applications_guardian ON admission_applications(guardian_id);
CREATE INDEX idx_documents_application ON admission_documents(application_id);
CREATE INDEX idx_exams_application ON entrance_exams(application_id);
CREATE INDEX idx_interviews_application ON admission_interviews(application_id);
CREATE INDEX idx_class_seats_lookup ON class_seats(institute_id, academic_session_id, class_name);
CREATE INDEX idx_approval_logs_app ON admission_approval_logs(application_id);
CREATE INDEX idx_ocr_jobs_app ON ocr_admission_jobs(application_id);
CREATE INDEX idx_ledgers_student ON fee_ledgers(student_id);
CREATE INDEX idx_ledger_items_ledger ON fee_ledger_items(ledger_id);

-- Compound indexes for high concurrent SaaS searches
CREATE INDEX idx_leads_inst_status ON leads(institute_id, status);
CREATE INDEX idx_leads_inst_session ON leads(institute_id, admission_session_id);
CREATE INDEX idx_applications_inst_status ON admission_applications(institute_id, status);
CREATE INDEX idx_applications_inst_class ON admission_applications(institute_id, class_name);
CREATE INDEX idx_applications_inst_session ON admission_applications(institute_id, admission_session_id);
CREATE INDEX idx_documents_inst_status ON admission_documents(institute_id, verification_status);
CREATE INDEX idx_ocr_jobs_inst_status ON ocr_admission_jobs(institute_id, status);
CREATE INDEX idx_ledgers_inst_status ON fee_ledgers(institute_id, status);
CREATE INDEX idx_lead_followups_inst_lead ON lead_followups(institute_id, lead_id);
