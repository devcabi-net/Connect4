# 🚀 Production Deployment Guide

This guide helps you deploy your Connect4 Discord Activity to production with real multiplayer functionality.

## 📋 Prerequisites

1. **Discord Developer Account**: [discord.com/developers](https://discord.com/developers)
2. **Supabase Account**: [supabase.com](https://supabase.com) (for multiplayer backend)
3. **Netlify Account**: [netlify.com](https://netlify.com) (for hosting)

## 🏗️ Step 1: Set up Supabase Backend

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be ready
3. Copy your **Project URL** and **Anon Key** from Settings → API

### 1.2 Set up Database Schema
1. Go to your Supabase dashboard → SQL Editor
2. Copy the contents of `supabase-schema.sql` from this repo
3. Run the SQL to create tables and enable real-time features

### 1.3 Configure Environment Variables
You'll need these values for deployment:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key  
- `VITE_DISCORD_CLIENT_ID`: Your Discord App ID

## 🎮 Step 2: Configure Discord Application

### 2.1 Update Activity Settings
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application → Activities
3. Update the **URL Mapping**:
   - **URL**: `your-netlify-domain.netlify.app` (you'll get this after deployment)
   - **Target**: `/` 

### 2.2 Enable Required Permissions
Ensure these are enabled:
- ✅ **Activities** 
- ✅ **Embedded App SDK**
- ✅ OAuth2 scopes: `identify`, `guilds`

## 🌐 Step 3: Deploy to Netlify

### 3.1 Connect Repository
1. Fork/clone this repository to your GitHub account
2. Go to [netlify.com](https://netlify.com) → New Site from Git
3. Connect your GitHub repository
4. Netlify will auto-detect the build settings from `netlify.toml`

### 3.2 Configure Environment Variables
In Netlify dashboard → Site Settings → Environment Variables, add:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_DISCORD_CLIENT_ID=1407945986424307713
```

### 3.3 Deploy
1. Click **Deploy Site**
2. Wait for build to complete
3. Note your Netlify domain (e.g., `amazing-app-123.netlify.app`)

## 🔗 Step 4: Update Discord Activity URL

1. Go back to Discord Developer Portal → Your App → Activities
2. Update the **URL Mapping** to your Netlify domain:
   - **URL**: `your-netlify-domain.netlify.app`
   - **Target**: `/`
3. Save changes

## ✅ Step 5: Test Your Production Activity

### 5.1 Test in Discord
1. Open Discord in a voice channel
2. Go to Activities and launch your app
3. You should now see:
   - ✅ **Real Discord user** (not demo user)
   - ✅ **Authorization dialog**
   - ✅ **Multiplayer rooms** synced between clients

### 5.2 Test Multiplayer
1. Open the activity on two different Discord clients
2. Create a room on one client
3. The room should appear on the other client
4. Join and test the multiplayer functionality

## 🔧 Troubleshooting

### Common Issues

**1. "Demo User" still showing in Discord**
- Check browser console for Discord detection logs
- Verify Discord SDK is loading properly
- Make sure you're testing in actual Discord (not browser)

**2. Rooms not syncing between clients**
- Verify Supabase environment variables are correct
- Check browser network tab for Supabase API calls
- Ensure real-time features are enabled in Supabase

**3. Discord Activity not loading**
- Verify Netlify domain matches Discord Activity URL exactly
- Check that `netlify.toml` headers are deployed correctly
- Ensure HTTPS is working (Netlify auto-provides SSL)

**4. Authentication errors**
- Double-check Discord Client ID in environment variables
- Verify OAuth2 scopes match in Discord Developer Portal
- Check that Activity is enabled in Discord app settings

### Debug Commands

Open browser console and run:

```javascript
// Check Discord detection
console.log('Discord Detection:', window.DiscordSDK !== undefined);

// Check environment variables  
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Discord Client ID:', import.meta.env.VITE_DISCORD_CLIENT_ID);

// Check current user
window.gameApp?.gameHub?.getCurrentPlayer();

// Check connection status
window.gameApp?.gameHub?.getDiscordService()?.isConnectedToDiscord();
```

## 📊 Monitoring & Analytics

### Supabase Dashboard
Monitor your multiplayer usage:
- **Database**: Check room and player tables
- **Real-time**: Monitor active connections
- **Logs**: View API calls and errors

### Netlify Analytics
Track deployment and performance:
- **Builds**: Deployment history
- **Functions**: API usage (if using Netlify functions)
- **Analytics**: Site traffic and performance

## 🚀 Production Optimizations

### Performance
- ✅ **Vite**: Fast builds and hot reload
- ✅ **CSS optimization**: Minimized and tree-shaken
- ✅ **Real-time subscriptions**: Only when needed
- ✅ **Local fallback**: Works without Supabase

### Security
- ✅ **Environment variables**: Secrets not in code
- ✅ **Row Level Security**: Enabled in Supabase
- ✅ **HTTPS**: Enforced by Netlify
- ✅ **CORS**: Properly configured

### Scalability
- ✅ **Supabase**: Auto-scaling database
- ✅ **CDN**: Global content delivery via Netlify
- ✅ **Real-time**: Efficient WebSocket connections

## 🎯 Next Steps

Once deployed, consider:
1. **Custom domain**: Configure your own domain
2. **Analytics**: Add game analytics and user tracking  
3. **More games**: Add additional game types
4. **Chat features**: Enhanced in-game communication
5. **Tournaments**: Organize competitive play

## 🔗 Useful Links

- [Discord Activities Developer Docs](https://discord.com/developers/docs/activities/overview)
- [Supabase Documentation](https://supabase.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

**Need help?** Check the troubleshooting section or open an issue in the repository!

