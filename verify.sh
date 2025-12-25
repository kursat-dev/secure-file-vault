#!/bin/bash
set -e

# Data
EMAIL="test@example.com"
PASSWORD="password123"
FILE="test.txt"

echo "1. Registering..."
# Try register, ignore error if exists
curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"
echo ""

echo "2. Logging in..."
LOGIN_RES=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

echo "Login Response: $LOGIN_RES"

# Extract Token (simple grep/cut hack)
TOKEN=$(echo $LOGIN_RES | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token: $TOKEN"

if [ -z "$TOKEN" ]; then
  echo "Failed to get token"
  exit 1
fi

echo "3. Uploading file..."
UPLOAD_RES=$(curl -s -X POST http://localhost:3000/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$FILE")

echo "Upload Response: $UPLOAD_RES"
FILE_ID=$(echo $UPLOAD_RES | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "File ID: $FILE_ID"

if [ -z "$FILE_ID" ]; then
  echo "Failed to get file ID"
  exit 1
fi

echo "4. Downloading file..."
curl -s -o downloaded_test.txt -w "%{http_code}" -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/files/$FILE_ID/download

echo ""
echo "5. Verifying content..."
if cmp -s "$FILE" "downloaded_test.txt"; then
  echo "✅ SUCCESS: Files match!"
else
  echo "❌ FAILURE: Files differ!"
  cat downloaded_test.txt
  exit 1
fi
