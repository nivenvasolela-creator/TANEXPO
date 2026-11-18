#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3000/api}"
PASS_COUNT=0

assert_status() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  local body="$4"
  if [ "$actual" != "$expected" ]; then
    echo "FAIL [$label]: expected HTTP $expected, got $actual"
    echo "Body: $body"
    exit 1
  fi
  PASS_COUNT=$((PASS_COUNT + 1))
  echo "PASS [$label]: HTTP $actual"
}

req() {
  local method="$1"
  local path="$2"
  local token="${3:-}"
  local data="${4:-}"

  local args=(-s -w "\n%{http_code}" -X "$method" "${BASE_URL}${path}" -H "Content-Type: application/json")
  if [ -n "$token" ]; then
    args+=(-H "Authorization: Bearer ${token}")
  fi
  if [ -n "$data" ]; then
    args+=(-d "$data")
  fi
  curl "${args[@]}"
}

parse_res() {
  local raw="$1"
  RESP_STATUS=$(echo "$raw" | tail -n1)
  RESP_BODY=$(echo "$raw" | sed '$d')
}

echo "=== TANEXPO Security Verification Suite against $BASE_URL ==="

# 1. Guest catalog access & /state isolation
parse_res "$(req GET /catalog)"
assert_status "Public catalog accessible to guests" "200" "$RESP_STATUS" "$RESP_BODY"

parse_res "$(req GET /state)"
assert_status "Public /state returns 200 catalog only" "200" "$RESP_STATUS" "$RESP_BODY"
if echo "$RESP_BODY" | grep -qE '"leads"|"bookings"|"transactions"|"savedProviderIds"'; then
  echo "FAIL: /state exposed private keys: $RESP_BODY"
  exit 1
fi
echo "PASS [/state excludes private entities]"
PASS_COUNT=$((PASS_COUNT + 1))

# 2. Removed GET /users
parse_res "$(req GET /users)"
assert_status "GET /users removed" "404" "$RESP_STATUS" "$RESP_BODY"

# 3. Unauthenticated calls to write & private endpoints return 401
for endpoint in \
  "POST:/leads:{}" \
  "POST:/bookings:{}" \
  "POST:/listings:{}" \
  "POST:/providers:{}" \
  "POST:/reviews:{}" \
  "POST:/transactions:{}" \
  "POST:/saved:{}" \
  "PUT:/auth/profile:{}" \
  "GET:/leads:" \
  "GET:/bookings:" \
  "GET:/transactions:" \
  "GET:/saved:" \
  "GET:/users/usr-1:"; do
  IFS=':' read -r m p d <<< "$endpoint"
  parse_res "$(req "$m" "$p" "" "$d")"
  assert_status "Unauthenticated $m $p returns 401" "401" "$RESP_STATUS" "$RESP_BODY"
done

# 4. /reset is blocked
parse_res "$(req POST /reset "" "{}")"
assert_status "Unauthenticated POST /reset blocked" "401" "$RESP_STATUS" "$RESP_BODY"

# 5. Registration security: cannot register as admin, password required >= 8 chars
TS="$(date +%s)"
parse_res "$(req POST /auth/register "" "{\"name\":\"Evil Admin\",\"email\":\"evil_${TS}@example.com\",\"password\":\"StrongPass123!\",\"role\":\"admin\"}")"
assert_status "Cannot register as admin" "403" "$RESP_STATUS" "$RESP_BODY"

parse_res "$(req POST /auth/register "" "{\"name\":\"Short Pass\",\"email\":\"short_${TS}@example.com\",\"password\":\"123\",\"role\":\"tourist\"}")"
assert_status "Registration rejects password < 8 chars" "400" "$RESP_STATUS" "$RESP_BODY"

# 6. Register Tourist, Provider A, and Provider B (all with valid passwords)
TOURIST_EMAIL="tourist_${TS}@example.com"
TOURIST_PASS="TouristSecret#2026"
parse_res "$(req POST /auth/register "" "{\"name\":\"Test Tourist\",\"email\":\"${TOURIST_EMAIL}\",\"password\":\"${TOURIST_PASS}\",\"role\":\"tourist\",\"touristProfile\":{\"touristType\":\"international\",\"homeCountry\":\"UK\",\"preferredCurrency\":\"USD\",\"preferredLanguage\":\"en\"}}")"
assert_status "Register tourist" "201" "$RESP_STATUS" "$RESP_BODY"
TOURIST_TOKEN=$(node -e "const d = JSON.parse(process.argv[1]); console.log(d.token);" "$RESP_BODY")
TOURIST_ID=$(node -e "const d = JSON.parse(process.argv[1]); console.log(d.user.id);" "$RESP_BODY")

# Login without password fails; wrong password fails with generic error
parse_res "$(req POST /auth/login "" "{\"emailOrPhone\":\"${TOURIST_EMAIL}\"}")"
assert_status "Login without password fails" "400" "$RESP_STATUS" "$RESP_BODY"

parse_res "$(req POST /auth/login "" "{\"emailOrPhone\":\"${TOURIST_EMAIL}\",\"password\":\"WrongPassword99\"}")"
assert_status "Login with wrong password returns 401" "401" "$RESP_STATUS" "$RESP_BODY"

parse_res "$(req POST /auth/login "" "{\"emailOrPhone\":\"nonexistent_${TS}@example.com\",\"password\":\"WrongPassword99\"}")"
assert_status "Login with unknown user returns 401" "401" "$RESP_STATUS" "$RESP_BODY"

# Provider A registers and tries to self-verify via verificationStatus='tanexpo_verified' & custom providerId=1
PROV_A_EMAIL="provA_${TS}@example.com"
PROV_PASS="ProviderSecret#2026"
parse_res "$(req POST /auth/register "" "{\"name\":\"Alpha Safaris\",\"email\":\"${PROV_A_EMAIL}\",\"phone\":\"+255700001${TS: -3}\",\"password\":\"${PROV_PASS}\",\"role\":\"provider\",\"providerProfile\":{\"businessName\":\"Alpha Safaris\",\"primaryCategory\":\"safari\",\"location\":\"Arusha\",\"region\":\"Northern Circuit\",\"providerId\":1,\"verificationStatus\":\"tanexpo_verified\"}}")"
assert_status "Register Provider A" "201" "$RESP_STATUS" "$RESP_BODY"
PROV_A_TOKEN=$(node -e "const d = JSON.parse(process.argv[1]); console.log(d.token);" "$RESP_BODY")
PROV_A_PID=$(node -e "const d = JSON.parse(process.argv[1]); console.log(d.user.providerProfile.providerId);" "$RESP_BODY")
PROV_A_VSTATUS=$(node -e "const d = JSON.parse(process.argv[1]); console.log(d.user.providerProfile.verificationStatus);" "$RESP_BODY")

if [ "$PROV_A_PID" = "1" ]; then
  echo "FAIL: Provider A hijacked client-supplied providerId=1!"
  exit 1
fi
if [ "$PROV_A_VSTATUS" = "tanexpo_verified" ]; then
  echo "FAIL: Provider A self-verified as tanexpo_verified!"
  exit 1
fi
echo "PASS [Server generated providerId=$PROV_A_PID and prevented self-verification (status=$PROV_A_VSTATUS)]"
PASS_COUNT=$((PASS_COUNT + 1))

# Tourist cannot verify a provider via admin endpoint or update provider
parse_res "$(req PUT "/admin/providers/${PROV_A_PID}/verify" "$TOURIST_TOKEN" "{\"verified\":true}")"
assert_status "Tourist cannot verify provider via admin route" "403" "$RESP_STATUS" "$RESP_BODY"

parse_res "$(req PUT "/providers/${PROV_A_PID}" "$TOURIST_TOKEN" "{\"verified\":true}")"
assert_status "Tourist cannot edit/verify provider" "403" "$RESP_STATUS" "$RESP_BODY"

# Provider A cannot reset database
parse_res "$(req POST /reset "$PROV_A_TOKEN" "{}")"
assert_status "Provider cannot call /reset" "403" "$RESP_STATUS" "$RESP_BODY"

# Provider B registers
PROV_B_EMAIL="provB_${TS}@example.com"
parse_res "$(req POST /auth/register "" "{\"name\":\"Beta Expeditions\",\"email\":\"${PROV_B_EMAIL}\",\"phone\":\"+255700002${TS: -3}\",\"password\":\"${PROV_PASS}\",\"role\":\"provider\",\"providerProfile\":{\"businessName\":\"Beta Expeditions\",\"primaryCategory\":\"beach\",\"location\":\"Zanzibar\",\"region\":\"Zanzibar Archipelago\"}}")"
assert_status "Register Provider B" "201" "$RESP_STATUS" "$RESP_BODY"
PROV_B_TOKEN=$(node -e "const d = JSON.parse(process.argv[1]); console.log(d.token);" "$RESP_BODY")
PROV_B_UID=$(node -e "const d = JSON.parse(process.argv[1]); console.log(d.user.id);" "$RESP_BODY")

# User profile ownership checks (self allowed, cross-user denied)
parse_res "$(req GET "/users/${TOURIST_ID}" "$TOURIST_TOKEN")"
assert_status "Tourist can read own user profile" "200" "$RESP_STATUS" "$RESP_BODY"

parse_res "$(req GET "/users/${PROV_B_UID}" "$TOURIST_TOKEN")"
assert_status "Tourist cannot read another user's profile" "403" "$RESP_STATUS" "$RESP_BODY"

parse_res "$(req PUT "/users/${PROV_B_UID}" "$TOURIST_TOKEN" "{\"name\":\"Hijacked\"}")"
assert_status "Tourist cannot modify another user's profile" "403" "$RESP_STATUS" "$RESP_BODY"

# Provider A creates a listing (price 1,000,000 TZS)
parse_res "$(req POST /listings "$PROV_A_TOKEN" "{\"title\":\"Serengeti Day Safari\",\"priceTZS\":1000000,\"duration\":\"1 Day\",\"category\":\"safari\",\"description\":\"Full day\",\"inclusions\":[\"4x4\"]}")"
assert_status "Provider A creates listing" "201" "$RESP_STATUS" "$RESP_BODY"
LISTING_A_ID=$(node -e "const d = JSON.parse(process.argv[1]); console.log(d.listing.id);" "$RESP_BODY")

# Tourist creates a lead for Provider A's listing (groupSize=2)
parse_res "$(req POST /leads "$TOURIST_TOKEN" "{\"listingId\":${LISTING_A_ID},\"touristName\":\"Test Tourist\",\"touristContact\":\"${TOURIST_EMAIL}\",\"date\":\"2026-10-01\",\"groupSize\":2,\"message\":\"Window seats please\"}")"
assert_status "Tourist creates lead for Provider A" "201" "$RESP_STATUS" "$RESP_BODY"
LEAD_A_ID=$(node -e "const d = JSON.parse(process.argv[1]); console.log(d.lead.id);" "$RESP_BODY")

# Provider B CANNOT read or edit Provider A's lead
parse_res "$(req GET "/leads/${LEAD_A_ID}" "$PROV_B_TOKEN")"
assert_status "Provider B cannot read Provider A lead" "403" "$RESP_STATUS" "$RESP_BODY"

parse_res "$(req PUT "/leads/${LEAD_A_ID}" "$PROV_B_TOKEN" "{\"status\":\"Contacted\"}")"
assert_status "Provider B cannot edit Provider A lead" "403" "$RESP_STATUS" "$RESP_BODY"

# Tourist creates booking with tampered amountTZS=1, commissionTZS=0, netPayoutTZS=9999999
parse_res "$(req POST /bookings "$TOURIST_TOKEN" "{\"leadId\":${LEAD_A_ID},\"paymentMethod\":\"M-Pesa\",\"amountTZS\":1,\"commissionTZS\":0,\"netPayoutTZS\":9999999}")"
assert_status "Tourist creates booking (server computes amounts)" "201" "$RESP_STATUS" "$RESP_BODY"
BOOKING_A_ID=$(node -e "const d = JSON.parse(process.argv[1]); console.log(d.booking.id);" "$RESP_BODY")
BOOKING_A_REF=$(node -e "const d = JSON.parse(process.argv[1]); console.log(d.booking.referenceCode);" "$RESP_BODY")
BOOKING_AMOUNT=$(node -e "const d = JSON.parse(process.argv[1]); console.log(d.booking.amountTZS);" "$RESP_BODY")
BOOKING_COMM=$(node -e "const d = JSON.parse(process.argv[1]); console.log(d.booking.commissionTZS);" "$RESP_BODY")
BOOKING_NET=$(node -e "const d = JSON.parse(process.argv[1]); console.log(d.booking.netPayoutTZS);" "$RESP_BODY")

if [ "$BOOKING_AMOUNT" != "2000000" ] || [ "$BOOKING_COMM" != "300000" ] || [ "$BOOKING_NET" != "1700000" ]; then
  echo "FAIL: Server did not compute expected amounts (got amount=$BOOKING_AMOUNT, comm=$BOOKING_COMM, net=$BOOKING_NET)"
  exit 1
fi
echo "PASS [Server computed amount=2000000, commission=300000, net=1700000 ignoring client values]"
PASS_COUNT=$((PASS_COUNT + 1))

# Provider B CANNOT read or edit Provider A's booking
parse_res "$(req GET "/bookings/${BOOKING_A_ID}" "$PROV_B_TOKEN")"
assert_status "Provider B cannot read Provider A booking" "403" "$RESP_STATUS" "$RESP_BODY"

parse_res "$(req PUT "/bookings/${BOOKING_A_ID}" "$PROV_B_TOKEN" "{\"status\":\"Completed\"}")"
assert_status "Provider B cannot edit Provider A booking" "403" "$RESP_STATUS" "$RESP_BODY"

# Review fails while booking is Upcoming
parse_res "$(req POST /reviews "$TOURIST_TOKEN" "{\"providerId\":${PROV_A_PID},\"rating\":5,\"comment\":\"Great!\",\"bookingRef\":\"${BOOKING_A_REF}\"}")"
assert_status "Review rejected for Upcoming booking" "400" "$RESP_STATUS" "$RESP_BODY"

# A booking cannot be completed (and so reviewed) until the traveler's payment is recorded,
# and the operator cannot record that payment themselves.
parse_res "$(req PUT "/bookings/${BOOKING_A_ID}" "$PROV_A_TOKEN" "{\"status\":\"Completed\"}")"
assert_status "Unpaid booking cannot be marked Completed" "409" "$RESP_STATUS" "$RESP_BODY"

parse_res "$(req POST /transactions "$PROV_A_TOKEN" "{\"bookingId\":${BOOKING_A_ID},\"paymentRail\":\"M-Pesa\"}")"
assert_status "Provider cannot record payment on own booking" "403" "$RESP_STATUS" "$RESP_BODY"

parse_res "$(req POST /transactions "$TOURIST_TOKEN" "{\"bookingId\":${BOOKING_A_ID},\"paymentRail\":\"M-Pesa\"}")"
assert_status "Tourist records payment for own booking" "201" "$RESP_STATUS" "$RESP_BODY"

# Provider A marks booking Completed, then Tourist can submit 1 review (2nd rejected with 409)
parse_res "$(req PUT "/bookings/${BOOKING_A_ID}" "$PROV_A_TOKEN" "{\"status\":\"Completed\"}")"
assert_status "Provider A marks booking Completed" "200" "$RESP_STATUS" "$RESP_BODY"

parse_res "$(req POST /reviews "$TOURIST_TOKEN" "{\"providerId\":${PROV_A_PID},\"rating\":5,\"comment\":\"Unforgettable safari!\",\"bookingRef\":\"${BOOKING_A_REF}\"}")"
assert_status "Tourist submits review for Completed booking" "201" "$RESP_STATUS" "$RESP_BODY"

parse_res "$(req POST /reviews "$TOURIST_TOKEN" "{\"providerId\":${PROV_A_PID},\"rating\":4,\"comment\":\"Duplicate review\",\"bookingRef\":\"${BOOKING_A_REF}\"}")"
assert_status "Duplicate review for same booking rejected" "409" "$RESP_STATUS" "$RESP_BODY"

# Logout invalidates session
parse_res "$(req POST /auth/logout "$TOURIST_TOKEN" "{}")"
assert_status "Logout succeeds" "200" "$RESP_STATUS" "$RESP_BODY"

parse_res "$(req GET /auth/me "$TOURIST_TOKEN")"
assert_status "Token rejected after logout" "401" "$RESP_STATUS" "$RESP_BODY"

echo "=== ALL ${PASS_COUNT} SECURITY CHECKS PASSED ==="
