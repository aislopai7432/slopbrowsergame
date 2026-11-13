# Bubble Bliss relay (runs on an old Android phone)

When two players' home networks block a direct connection, the game sends its data through this relay instead. It runs on a spare Android phone in Termux, and a free Cloudflare quick tunnel makes it reachable from the internet: **no port forwarding, no accounts, no monthly limits**. The game always tries a direct connection first and only uses the relay when that fails.

## One-time setup

1. **Install Termux from F-Droid** (https://f-droid.org/packages/com.termux/). The Play Store version is outdated and won't work.
2. **Install the tools.** In Termux:
   ```
   pkg update
   pkg install nodejs git cloudflared
   ```
3. **Make a GitHub token so the phone can publish the relay's address.**
   On github.com: Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token.
   - Repository access: **Only select repositories** → `slopbrowsergame`
   - Permissions: **Contents → Read and write** (nothing else)
   - Copy the token. You'll paste it once in the next step, as the password.
4. **Get the game's code onto the phone:**
   ```
   git clone https://github.com/aislopai7432/slopbrowsergame
   cd slopbrowsergame
   git config user.name "relay phone"
   git config user.email "relay@example.invalid"
   git config credential.helper store
   ```
5. **Stop Android killing it:** Settings → Apps → Termux → Battery → **Unrestricted** (wording varies by phone). Keep the phone plugged in and on your home Wi-Fi.

## Start the relay

```
cd ~/slopbrowsergame/relay
bash start.sh
```

The first time, it asks for your GitHub username and password: use the **token** from step 3 as the password. It's saved after that.

You should see `Published relay address: wss://....trycloudflare.com` and `Relay is up`. About a minute later the game on GitHub Pages knows the address. Leave Termux running.

## Optional: start automatically when the phone reboots

Install **Termux:Boot** from F-Droid, open it once, then in Termux:
```
mkdir -p ~/.termux/boot
printf '#!/data/data/com.termux/files/usr/bin/sh\ncd ~/slopbrowsergame/relay && bash start.sh\n' > ~/.termux/boot/relay.sh
chmod +x ~/.termux/boot/relay.sh
```

## Good to know

- The tunnel's address changes whenever the relay restarts; `start.sh` publishes the new one automatically.
- Each relayed friend uses roughly 20–40 KB/s of your home upload while playing.
- The relay only passes messages along; it doesn't store anything, and it keeps nothing once a room closes.
- To stop it: press Ctrl+C in Termux (and `termux-wake-unlock` to let the phone sleep again).
