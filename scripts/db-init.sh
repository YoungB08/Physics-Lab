#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${DB_NAME:-vatly_thpt}"
DB_USER="${DB_USER:-postgres}"

psql -U "$DB_USER" -d "$DB_NAME" -f apps/api/database/init.sql
psql -U "$DB_USER" -d "$DB_NAME" -f apps/api/database/seed.sql

echo "[OK] Da khoi tao database bang SQL thuần"
