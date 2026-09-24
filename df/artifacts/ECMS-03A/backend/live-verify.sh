#!/usr/bin/env bash
# Live verification of ECMS-03A against the running local stack (author :8080, publish :8081).
set -u
A=http://localhost:8080
P=http://localhost:8081
ASSET=2e96db6d-17fd-4017-8b2e-0f38a7a9bf72
PROBE=ecms03-probe
PASS=0; FAIL=0
T0=$(docker exec flexcms-postgres psql -U flexcms -d flexcms_author -Atc "select now()")
check() { if [ "$2" = "$3" ]; then echo "PASS  $1 ($2)"; PASS=$((PASS+1)); else echo "FAIL  $1 (got '$2', want '$3')"; FAIL=$((FAIL+1)); fi; }
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
pubrows() { docker exec flexcms-postgres psql -U flexcms -d flexcms_publish -Atc "select count(*) from assets where id='$1'"; }
waitrows() { for i in $(seq 1 20); do [ "$(pubrows "$1")" = "$2" ] && break; sleep 0.5; done; pubrows "$1"; }

echo "== TC03/TC04: serving on author =="
check "author original 200" "$(code $A/dam/renditions/$ASSET)" 200
H=$(curl -s -D - -o /dev/null $A/dam/renditions/$ASSET)
echo "$H" | grep -iE '^(content-type|cache-control|etag|content-security-policy|x-content-type-options):'
ETAG=$(echo "$H" | grep -i '^etag:' | cut -d' ' -f2 | tr -d '\r')
check "cache-control public 1 day" "$(echo "$H" | grep -ci 'cache-control: public, max-age=86400')" 1
check "304 on matching If-None-Match" "$(code -H "If-None-Match: $ETAG" $A/dam/renditions/$ASSET)" 304
check "missing rendition falls back to original 200" "$(code $A/dam/renditions/$ASSET/hero-desktop)" 200
check "unknown asset 404" "$(code $A/dam/renditions/00000000-0000-0000-0000-000000000000)" 404
check "malformed rendition key 404" "$(code $A/dam/renditions/$ASSET/BAD_KEY)" 404
echo "404 body: $(curl -s $A/dam/renditions/00000000-0000-0000-0000-000000000000 | head -c 200)"

echo "== TC02: unpublished asset is not on publish =="
check "publish 404 before publish" "$(code $P/dam/renditions/$ASSET)" 404

echo "== TC02: publishing a page publishes its referenced asset =="
curl -s -X POST $A/api/author/content/node -H 'Content-Type: application/json' \
  -d "{\"parentPath\":\"/tut-usa\",\"name\":\"$PROBE\",\"resourceType\":\"flexcms/page\",\"properties\":{\"jcr:title\":\"ECMS-03 probe\"},\"userId\":\"ecms03\"}" -o /dev/null -w 'create page %{http_code}\n'
curl -s -X POST $A/api/author/content/node -H 'Content-Type: application/json' \
  -d "{\"parentPath\":\"/tut-usa/$PROBE\",\"name\":\"image\",\"resourceType\":\"flexcms/image\",\"properties\":{\"src\":\"/api/author/assets/$ASSET/content\",\"caption\":\"<img src=\\\"http://localhost:8080/api/author/assets/$ASSET/content\\\">\"},\"userId\":\"ecms03\"}" -o /dev/null -w 'create image %{http_code}\n'
curl -s -X POST $A/api/author/content/bulk/publish -H 'Content-Type: application/json' \
  -d "{\"paths\":[\"/tut-usa/$PROBE\"],\"userId\":\"ecms03\"}" -o /dev/null -w 'bulk publish %{http_code}\n'
check "publish row created under author id" "$(waitrows $ASSET 1)" 1
check "publish original 200" "$(code $P/dam/renditions/$ASSET)" 200
check "publish rendition-or-fallback 200" "$(code $P/dam/renditions/$ASSET/thumbnail)" 200
BYTES_A=$(curl -s $A/dam/renditions/$ASSET | md5sum | cut -c1-32); BYTES_P=$(curl -s $P/dam/renditions/$ASSET | md5sum | cut -c1-32)
check "publish serves the same bytes as author" "$BYTES_P" "$BYTES_A"

echo "== TC03: delivery JSON uses canonical URLs =="
for i in $(seq 1 20); do J=$(curl -s "$P/api/content/v1/pages/tut-usa/$PROBE"); echo "$J" | grep -q "/dam/renditions/$ASSET" && break; sleep 0.5; done
echo "publish page JSON: $(echo "$J" | head -c 400)"
check "publish JSON has canonical URL" "$(echo "$J" | grep -c "/dam/renditions/$ASSET")" 1
check "publish JSON has no /api/author/" "$(echo "$J" | grep -c '/api/author/')" 0
JA=$(curl -s "$A/api/content/v1/pages/tut-usa/$PROBE")
check "author delivery JSON has no /api/author/" "$(echo "$JA" | grep -c '/api/author/')" 0
check "stored author content unchanged" "$(curl -s "$A/api/author/content/node?path=/tut-usa/$PROBE/image" | grep -c "/api/author/assets/$ASSET/content")" 1

echo "== TC02: explicit unpublish withdraws the asset =="
R=$(curl -s -X POST "$A/api/author/assets/$ASSET/unpublish?userId=ecms03"); echo "unpublish: $R"
check "publish row removed" "$(waitrows $ASSET 0)" 0
check "publish 404 after unpublish" "$(code $P/dam/renditions/$ASSET)" 404
check "author still serves it" "$(code $A/dam/renditions/$ASSET)" 200
R=$(curl -s -X POST "$A/api/author/assets/$ASSET/publish?userId=ecms03"); echo "publish: $R"
check "explicit publish restores row" "$(waitrows $ASSET 1)" 1
check "publish 200 after explicit publish" "$(code $P/dam/renditions/$ASSET)" 200
check "publish unknown asset 404 (RFC 7807)" "$(code -X POST $A/api/author/assets/00000000-0000-0000-0000-000000000000/publish)" 404

echo "== TC02: deleting an asset on author retracts it from publish =="


UP=$(curl -s -X POST $A/api/author/assets -F "file=@${PROBE_PNG:?set PROBE_PNG to any real PNG file};type=image/png" -F "path=/content/dam/tut-usa/ecms03/probe.png" -F siteId=tut-usa -F userId=ecms03)
TID=$(echo "$UP" | sed -n 's/.*"id":"\([0-9a-f-]*\)".*/\1/p' | head -1); echo "uploaded $TID"
curl -s -X POST "$A/api/author/assets/$TID/publish?userId=ecms03" -o /dev/null -w 'publish throwaway %{http_code}\n'
check "throwaway on publish" "$(waitrows $TID 1)" 1
check "throwaway 200 on publish" "$(code $P/dam/renditions/$TID)" 200
curl -s -X DELETE "$A/api/author/assets?path=/content/dam/tut-usa/ecms03/probe.png&userId=ecms03" -o /dev/null -w 'delete throwaway %{http_code}\n'
check "throwaway row gone from publish" "$(waitrows $TID 0)" 0
check "throwaway 404 on publish" "$(code $P/dam/renditions/$TID)" 404
check "throwaway 404 on author" "$(code $A/dam/renditions/$TID)" 404

echo "== replication log =="
docker exec flexcms-postgres psql -U flexcms -d flexcms_author -Atc "select action, replication_type, content_path, node_id from replication_log where initiated_by='ecms03' order by initiated_at"

echo "== cleanup: delete probe page (replicates deletion) =="
curl -s -X DELETE "$A/api/author/content/node?path=/tut-usa/$PROBE&userId=ecms03" -o /dev/null -w 'delete probe %{http_code}\n'
curl -s -X POST "$A/api/author/assets/$ASSET/unpublish?userId=ecms03" -o /dev/null -w 'unpublish shared asset %{http_code}
'
echo "RESULT: $PASS passed, $FAIL failed"
echo "== replication log persisted for AFTER_COMMIT-triggered publish =="
check "TREE log row for probe page" "$(docker exec flexcms-postgres psql -U flexcms -d flexcms_author -Atc "select count(*) from replication_log where replication_type='TREE' and content_path='content.tut-usa.$PROBE' and initiated_at >= '$T0'")" 1
check "ASSET log row from page publish (referenced asset)" "$(docker exec flexcms-postgres psql -U flexcms -d flexcms_author -Atc "select count(*) from replication_log where replication_type='ASSET' and action='ACTIVATE' and node_id='$ASSET' and initiated_at >= '$T0'")" 2
check "DELETE log row for throwaway asset" "$(docker exec flexcms-postgres psql -U flexcms -d flexcms_author -Atc "select count(*) from replication_log where replication_type='ASSET' and action='DELETE' and node_id='$TID'")" 1
echo "RESULT (final): $PASS passed, $FAIL failed"
