# Teebot

Teeworlds bot for Discord. Main feature is to change player's voice channel when teams are shuffling in Teeworlds.

## Requirements

- Node.js 12

## Installation & other commands

- Copy environment variables file, and fill your data there.

```
cp .env.dist .env
nano .env
```

- Install dependencies.

```
npm install
```

- Start developing.

```
npm run dev
```

- Deploy.

```
npx shipit production deploy
```
