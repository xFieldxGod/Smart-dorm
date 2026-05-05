-- Smart Dorm Database Schema
-- PostgreSQL 16

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(50)  UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name   VARCHAR(100) NOT NULL,
    phone       VARCHAR(20)  DEFAULT '',
    role        VARCHAR(10)  NOT NULL CHECK (role IN ('admin', 'tenant')),
    room_id     INTEGER      DEFAULT NULL,
    created_at  TIMESTAMP    DEFAULT NOW(),
    updated_at  TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- 2. ROOMS
-- ============================================
CREATE TABLE IF NOT EXISTS rooms (
    id          SERIAL PRIMARY KEY,
    number      VARCHAR(20)  UNIQUE NOT NULL,
    type        VARCHAR(30)  NOT NULL DEFAULT 'Studio',
    status      VARCHAR(20)  NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'maintenance')),
    base_rent   DECIMAL(10,2) NOT NULL DEFAULT 0,
    tenant_id   INTEGER      DEFAULT NULL,
    created_at  TIMESTAMP    DEFAULT NOW(),
    updated_at  TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_tenant ON rooms(tenant_id);

-- ============================================
-- 3. BILLS
-- ============================================
CREATE TABLE IF NOT EXISTS bills (
    id                SERIAL PRIMARY KEY,
    room_id           INTEGER       NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    tenant_id         INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month             VARCHAR(7)    NOT NULL,
    base_rent         DECIMAL(10,2) NOT NULL DEFAULT 0,
    water_units       INT           DEFAULT 0,
    electricity_units INT           DEFAULT 0,
    total             DECIMAL(10,2) NOT NULL DEFAULT 0,
    status            VARCHAR(20)   NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'paid', 'overdue')),
    due_date          DATE          NOT NULL,
    qr_reference      VARCHAR(50)   DEFAULT '',
    slip_image        TEXT          DEFAULT '',
    created_at        TIMESTAMP     DEFAULT NOW(),
    paid_at           TIMESTAMP     DEFAULT NULL,
    submitted_at      TIMESTAMP     DEFAULT NULL,
    UNIQUE(room_id, month)
);

CREATE INDEX IF NOT EXISTS idx_bills_tenant_month ON bills(tenant_id, month);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);

-- ============================================
-- 4. MAINTENANCE REQUESTS
-- ============================================
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id               SERIAL PRIMARY KEY,
    tenant_id        INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id          INTEGER      NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    title            VARCHAR(100) NOT NULL,
    category         VARCHAR(30)  NOT NULL DEFAULT 'ทั่วไป',
    description      TEXT         DEFAULT '',
    status           VARCHAR(20)  NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'cancelled')),
    assignee         VARCHAR(100) DEFAULT '',
    admin_note       TEXT         DEFAULT '',
    resident_image   TEXT         DEFAULT '',
    completion_image TEXT         DEFAULT '',
    created_at       TIMESTAMP    DEFAULT NOW(),
    updated_at       TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maint_tenant ON maintenance_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maint_status ON maintenance_requests(status);

-- ============================================
-- 5. ANNOUNCEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS announcements (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(150) NOT NULL,
    message     TEXT         NOT NULL,
    priority    VARCHAR(10)  NOT NULL DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high')),
    created_by  INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ann_created ON announcements(created_at DESC);
