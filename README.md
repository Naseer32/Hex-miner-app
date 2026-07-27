# ⬡ Hex Miner

A tap-to-mine clicker game built on the **Unicity** testnet, for the Unicity Labs "Epoch Four" hackathon (Games track).

## How it works

- Connect your own **Sphere wallet** — no account creation, no sign-up.
- Tap any hex tile to mine 1 UCT, minted directly and verifiably to your own wallet on the Unicity testnet2 network.
- Your wallet balance *is* your score — every tap is a real, on-chain mint you can verify yourself.
- A short cooldown between taps keeps it a game rather than a spam-click race.

## Play it

👉 [hex-miner-app.vercel.app](https://hex-miner-app.vercel.app)

You'll need a **Sphere wallet** to connect. Get one at [sphere.unicity.network](https://sphere.unicity.network).

## Built with

- [Sphere SDK](https://github.com/unicity-sphere/sphere-sdk) — wallet connection (Sphere Connect protocol) and self-minting on Unicity testnet2
- React + Vite
- No backend — the wallet connection and minting happen entirely client-side via the Connect protocol

## Why this approach

Hex Miner uses the Sphere Connect protocol's `mint` intent so **anyone can play with their own wallet** — there's no shared game server holding funds, no custodial risk, and every mint is a real, independently verifiable transaction on Unicity's testnet2 network.
