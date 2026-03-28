#!/usr/bin/env python3
"""
QA Data Seeder — Wrapper that patches seed_test_data.py for remote QA via SSH tunnel
Expects SSH tunnels:
  localhost:15432 → QA postgres:5432
  localhost:18080 → QA author:8080
"""
import sys
import os

# Patch the module before importing
sys.path.insert(0, os.path.dirname(__file__))

import seed_test_data as seed

# Override connection settings for QA (via SSH tunnel)
QA_DB_PASSWORD = "FlexCmsQA2024!"
QA_DB_PORT = 15432
QA_API_PORT = 18080

# Patch the API base URL
seed.AUTHOR_API = f"http://localhost:{QA_API_PORT}"

# Patch DB connection functions
_orig_get_db_conn = seed.get_db_conn
_orig_get_pim_db_conn = seed.get_pim_db_conn

def qa_get_db_conn():
    import psycopg2
    return psycopg2.connect(
        host="localhost", port=QA_DB_PORT,
        dbname="flexcms_author", user="flexcms", password=QA_DB_PASSWORD
    )

def qa_get_pim_db_conn():
    import psycopg2
    return psycopg2.connect(
        host="localhost", port=QA_DB_PORT,
        dbname="flexcms_pim", user="flexcms", password=QA_DB_PASSWORD
    )

seed.get_db_conn = qa_get_db_conn
seed.get_pim_db_conn = qa_get_pim_db_conn

if __name__ == "__main__":
    print(f"Using API: {seed.AUTHOR_API}")
    print(f"Using DB: localhost:{QA_DB_PORT} (password=***)")
    seed.main()

