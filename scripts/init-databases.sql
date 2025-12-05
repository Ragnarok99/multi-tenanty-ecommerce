-- ============================================================
-- Multi-Tenant Ecommerce - Database Initialization Script
-- ============================================================
-- This script creates the separate databases for each microservice.
-- Run this script once when setting up the PostgreSQL instance.
-- ============================================================

-- Create databases for each microservice
CREATE DATABASE tenant_db;
CREATE DATABASE product_db;
CREATE DATABASE order_db;

-- Grant privileges (if using a specific user)
-- GRANT ALL PRIVILEGES ON DATABASE tenant_db TO your_user;
-- GRANT ALL PRIVILEGES ON DATABASE product_db TO your_user;
-- GRANT ALL PRIVILEGES ON DATABASE order_db TO your_user;

-- Enable UUID extension in each database
\c tenant_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c product_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c order_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
