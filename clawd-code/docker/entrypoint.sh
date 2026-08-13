#!/bin/sh
set -e

# ── Validate required env vars ────────────────────────────────
if [ -z "$ANTHROPIC_API_KEY" ] && [ -z "$XAI_API_KEY" ]; then
  echo "ERROR: Set XAI_API_KEY or ANTHROPIC_API_KEY." >&2
  echo "" >&2
  echo "  docker run -p 3000:3000 -e XAI_API_KEY=... clawd-code-web" >&2
  echo "" >&2
  echo "  Or via docker-compose with a .env file:" >&2
  echo "    XAI_API_KEY=... docker-compose up" >&2
  exit 1
fi

# The API key is forwarded to child PTY processes via process.env.

echo "Clawd Code web terminal starting on port ${PORT:-3000}..."
if [ -n "$AUTH_TOKEN" ]; then
  echo "  Auth token protection: enabled"
fi
if [ -n "$ALLOWED_ORIGINS" ]; then
  echo "  Allowed origins: $ALLOWED_ORIGINS"
fi
echo "  Max sessions: ${MAX_SESSIONS:-5}"

# Hand off to the PTY WebSocket server
exec bun /app/src/server/web/pty-server.ts
