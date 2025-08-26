# Discord Authentication Setup

This guide helps you set up proper Discord authentication for the Connect4 game instead of using demo mode.

## Environment Variables Setup

Create a `.env` file in the root directory of your project with the following variables:

```env
# Discord Configuration
VITE_DISCORD_CLIENT_ID=your_discord_application_client_id_here

# Supabase Configuration (for multiplayer backend)
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Development Configuration
# Set to true when testing Discord auth locally (outside of Discord)
VITE_FORCE_DISCORD_MODE=false
```

## Discord Application Setup

1. **Create a Discord Application:**
   - Go to https://discord.com/developers/applications
   - Click "New Application"
   - Give it a name like "Connect4 Game"

2. **Get your Client ID:**
   - In your application's "General Information" tab
   - Copy the "Application ID" (this is your Client ID)
   - Add it to your `.env` file as `VITE_DISCORD_CLIENT_ID`

3. **Set up OAuth2 Redirects:**
   - Go to "OAuth2" tab
   - Add redirect URLs:
     - `https://localhost:3000` (for local development)
     - Your production URL when deployed

4. **Configure Activity:**
   - Go to "Activities" tab
   - Set up your activity with proper URL targets

## Testing Discord Authentication

### Option 1: Test in Discord (Recommended)
1. Deploy your app to a public HTTPS URL
2. Add it as a Discord Activity
3. Test within Discord

### Option 2: Force Discord Mode (Development)
1. Set `VITE_FORCE_DISCORD_MODE=true` in your `.env`
2. This will attempt Discord authentication even outside Discord
3. Useful for debugging auth flow locally

## Supabase Setup (Optional - for multiplayer)

1. **Create Supabase Project:**
   - Go to https://supabase.com
   - Create a new project

2. **Get your credentials:**
   - Go to Settings > API
   - Copy "Project URL" and "anon public" key
   - Add them to your `.env` file

3. **Set up database:**
   - Use the `supabase-schema.sql` file to create necessary tables

## Troubleshooting

**Game still shows "Demo User":**
- Check that your `.env` file is in the root directory
- Restart your development server after adding environment variables
- Check browser console for Discord detection logs

**Discord SDK errors:**
- Ensure your client ID is correct
- Check that redirect URLs are properly configured
- Make sure you're testing in an HTTPS environment

**Authentication fails:**
- Check that all scopes are properly configured
- Ensure your Discord app has the right permissions
- Look at browser console for detailed error messages
