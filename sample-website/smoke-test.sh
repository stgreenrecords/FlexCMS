#!/usr/bin/env bash
# =============================================================================
# WKND Adventures — Install + GraphQL smoke test
# Verifies the sample website is installed and the API returns expected data.
# Usage: ./smoke-test.sh [--api http://localhost:8080/graphql]
# =============================================================================
set -euo pipefail

API="${FLEXCMS_GRAPHQL_API:-http://localhost:8080/graphql}"

while [[ $# -gt 0 ]]; do
  case $1 in
    --api) API="$2"; shift 2 ;;
    *) echo "Unknown flag: $1"; exit 1 ;;
  esac
done

echo "======================================================"
echo " WKND Smoke Test"
echo " GraphQL API: $API"
echo "======================================================"

fail() { echo "FAIL: $1"; exit 1; }
pass() { echo "PASS: $1"; }

# --- 1. Home page node ---------------------------------------------------------
RESULT=$(curl -s -X POST "$API" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ node(path: \"wknd.language-masters.en\") { path resourceType } }"}')

echo "$RESULT" | grep -q '"path":"wknd.language-masters.en"' \
  && pass "Home page node exists" \
  || fail "Home page node not found. Got: $RESULT"

# --- 2. Adventures section -----------------------------------------------------
RESULT=$(curl -s -X POST "$API" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ node(path: \"wknd.language-masters.en.adventures\") { path } }"}')

echo "$RESULT" | grep -q '"path":"wknd.language-masters.en.adventures"' \
  && pass "Adventures section exists" \
  || fail "Adventures section not found. Got: $RESULT"

# --- 3. XF header exists -------------------------------------------------------
RESULT=$(curl -s -X POST "$API" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ node(path: \"experience-fragments.wknd.language-masters.en.site.header.master\") { path } }"}')

echo "$RESULT" | grep -q '"path":"experience-fragments.wknd.language-masters.en.site.header.master"' \
  && pass "Header XF variation exists" \
  || fail "Header XF not found. Got: $RESULT"

# --- 4. At least 5 adventure pages --------------------------------------------
RESULT=$(curl -s -X POST "$API" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ node(path: \"wknd.language-masters.en.adventures\") { children { path } } }"}')

COUNT=$(echo "$RESULT" | grep -o '"path":' | wc -l)
[ "$COUNT" -ge 5 ] \
  && pass "Adventure pages count: $COUNT" \
  || fail "Expected >= 5 adventure pages, got $COUNT. Response: $RESULT"

echo ""
echo "All smoke tests passed."
