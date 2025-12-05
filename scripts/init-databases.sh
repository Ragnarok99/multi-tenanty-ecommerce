#!/bin/bash
# ============================================================
# Multi-Tenant Ecommerce - Database Initialization Script
# ============================================================
# This script creates the separate databases for each microservice.
# Run: ./scripts/init-databases.sh
# ============================================================

set -e

# Default values (can be overridden by environment variables)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USERNAME="${DB_USERNAME:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"

echo "🗄️  Initializing databases..."
echo "   Host: $DB_HOST:$DB_PORT"
echo "   User: $DB_USERNAME"

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

# Function to create database if it doesn't exist
create_db_if_not_exists() {
    local db_name=$1
    echo -n "   Creating database '$db_name'... "
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -lqt | cut -d \| -f 1 | grep -qw "$db_name"; then
        echo "already exists ✓"
    else
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -c "CREATE DATABASE $db_name;" > /dev/null 2>&1
        echo "created ✓"
    fi
    
    # Enable UUID extension
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$db_name" -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' > /dev/null 2>&1
}

# Create databases for each microservice
create_db_if_not_exists "tenant_db"
create_db_if_not_exists "product_db"
create_db_if_not_exists "order_db"

echo ""
echo "✅ All databases initialized successfully!"
