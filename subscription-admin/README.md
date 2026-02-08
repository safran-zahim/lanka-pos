# Subscription Admin

Simple admin app to toggle subscription status on the POS backend.

## Setup
```bash
cd subscription-admin
npm install
```

## Environment
Create `.env`:
```
VITE_API_URL=http://localhost:3000
```

## Run
```bash
npm run dev
```

## Usage
1. Login to the POS backend and copy the admin JWT.
2. Paste JWT into this app.
3. Select subscription status and click Update.
