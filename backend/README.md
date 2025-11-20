# GameMarket Backend

This directory contains all private/sensitive files and the backend server for GameMarket.

## Files

- `server.js` - Express backend server handling payments and account delivery
- `.env` - Environment variables (API keys, passwords) - **NEVER commit this file**
- `accounts.json` - Account credentials database - **NEVER commit this file**
- `package.json` - Backend dependencies

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure `.env` file with your credentials:
   ```
   STRIPE_SECRET_KEY=your_stripe_secret_key
   ADMIN_PASSWORD=your_admin_password
   ```

3. Start the server:
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

The backend will run on http://localhost:4242/

## Security Note

All files in this directory contain sensitive information and should be kept private. Make sure `.gitignore` is properly configured to exclude:
- `.env`
- `accounts.json`
- `node_modules/`
