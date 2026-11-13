#!/data/data/com.termux/files/usr/bin/bash
# Starts the Bubble Bliss relay on this phone and publishes its address so the game can find it.
#   1. runs the relay server (server.js) on 127.0.0.1:8787
#   2. opens a free Cloudflare quick tunnel to it (no router or port forwarding needed)
#   3. writes the tunnel's address into ../relay.json and pushes it to GitHub,
#      so the game on GitHub Pages picks it up (takes about a minute to go live)
# If the relay or the tunnel stops, everything restarts and the new address is published again.
cd "$(dirname "$0")" || exit 1
PORT=8787
command -v termux-wake-lock >/dev/null && termux-wake-lock   # keep Android from sleeping Termux
[ -d node_modules ] || npm install --omit=dev || exit 1

publish() {
  printf '{"url": "%s", "updated": "%s"}\n' "$1" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > ../relay.json
  ( cd .. && git add relay.json && git commit -q -m "Relay address update" && \
    for i in 1 2 3 4; do git pull -q --rebase && git push -q && break; sleep $((i * 5)); done ) \
    && echo "Published relay address: $1" || echo "!! Could not push relay.json to GitHub (see the setup guide)"
}

while true; do
  PORT=$PORT node server.js > relay.log 2>&1 &
  RELAY=$!
  cloudflared tunnel --no-autoupdate --url "http://127.0.0.1:$PORT" > tunnel.log 2>&1 &
  TUNNEL=$!
  URL=""
  for i in $(seq 1 60); do
    URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' tunnel.log | head -1)
    [ -n "$URL" ] && break
    sleep 1
  done
  if [ -n "$URL" ]; then
    publish "wss://${URL#https://}"
    echo "Relay is up. Leave this running (phone plugged in). Ctrl+C to stop."
  else
    echo "!! Couldn't open a Cloudflare tunnel (no internet?). Retrying in 30s."
  fi
  wait -n $RELAY $TUNNEL 2>/dev/null   # returns when either one stops
  echo "Relay or tunnel stopped, restarting in 5s..."
  kill $RELAY $TUNNEL 2>/dev/null
  sleep 5
done
