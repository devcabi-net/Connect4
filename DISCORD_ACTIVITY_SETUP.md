# 🎯 Discord Activity Setup Guide

Based on [Discord's Official Documentation](https://discord.com/developers/docs/activities/building-an-activity)

## 📋 **Prerequisites**

### **1. Discord Application Setup**
- [ ] Create Discord application at [Discord Developer Portal](https://discord.com/developers/applications)
- [ ] Note your **Application ID** (Client ID)
- [ ] Note your **Client Secret**
- [ ] Enable **Embedded App SDK** in your application settings

### **2. OAuth2 Configuration**
- [ ] Go to **OAuth2** tab in your Discord application
- [ ] Add redirect URLs:
  - `https://your-domain.com/`
  - `https://discord.com/oauth2/authorize`
- [ ] Select required scopes: `identify`, `guilds`, `rpc.activities.write`

### **3. Activity Configuration**
- [ ] Go to **Activities** tab in your Discord application
- [ ] Set **Activity Type** to "Playing"
- [ ] Configure **Activity Metadata**:
  - Name: "Connect 4 Game Hub"
  - Description: "Play Connect 4 with friends in voice channels"
  - Activity URL: `https://your-domain.com/`

## 🔧 **Implementation Requirements**

### **1. Discord SDK Integration**
```typescript
import { DiscordSDK } from '@discord/embedded-app-sdk';

// Initialize with your client ID
const discordSdk = new DiscordSDK(YOUR_CLIENT_ID);

// Wait for SDK to be ready
await discordSdk.ready();
```

### **2. OAuth2 Flow (Required)**
```typescript
// Step 1: Request authorization
const { code } = await discordSdk.commands.authorize({
  client_id: YOUR_CLIENT_ID,
  response_type: 'code',
  state: '',
  prompt: 'none',
  scope: ['identify', 'guilds', 'rpc.activities.write'],
});

// Step 2: Exchange code for token (server-side)
const response = await fetch('/api/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code }),
});
const { access_token } = await response.json();

// Step 3: Authenticate with Discord
const auth = await discordSdk.commands.authenticate({
  access_token,
});
```

### **3. Activity Status Updates**
```typescript
// Set initial activity
await discordSdk.commands.setActivity({
  activity: {
    type: 0, // Playing
    details: 'Playing Connect 4',
    state: 'In lobby',
    timestamps: { start: Date.now() },
    assets: {
      large_image: 'game_lobby',
      large_text: 'Connect 4 Game Hub'
    },
    instance: true
  }
});

// Update activity during gameplay
await discordSdk.commands.setActivity({
  activity: {
    type: 0,
    details: 'Playing Connect 4',
    state: 'In game',
    timestamps: { start: Date.now() },
    assets: {
      large_image: 'game_active',
      large_text: 'Connect 4 Game Hub'
    },
    instance: true
  }
});
```

## 🚨 **Critical Requirements**

### **1. Content Security Policy**
- **Discord Activities** cannot make external API calls
- **Token exchange** must use Discord's proxy or internal endpoint
- **CORS** must allow Discord domains

### **2. Activity Launch Parameters**
Discord passes these parameters when launching activities:
- `frame_id` - Unique frame identifier
- `instance_id` - Activity instance ID
- `channel_id` - Voice channel ID
- `guild_id` - Server ID
- `activity_id` - Activity identifier
- `application_id` - Your application ID
- `launch_id` - Launch session ID

### **3. Environment Detection**
```typescript
private isRunningInDiscord(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Check for Discord Activity parameters
  const hasDiscordParams = urlParams.has('frame_id') || 
                          urlParams.has('instance_id') || 
                          urlParams.has('channel_id') || 
                          urlParams.has('guild_id') ||
                          urlParams.has('activity_id') ||
                          urlParams.has('application_id') ||
                          urlParams.has('launch_id');
  
  // Check if running in Discord iframe
  const isInDiscordFrame = window.self !== window.top;
  
  return hasDiscordParams || isInDiscordFrame;
}
```

## 🧪 **Testing Your Activity**

### **1. Local Development**
- Start dev server: `npm run dev`
- Open `http://localhost:3000`
- Should fall back to demo mode
- Check console for Discord detection results

### **2. Discord Activity Testing**
- Deploy to Discord-compatible domain
- Launch activity in Discord voice channel
- Should show OAuth2 authorization prompt
- Should authenticate and display real user

### **3. Debug Commands**
```javascript
// Check Discord parameters
const urlParams = new URLSearchParams(window.location.search);
console.log('Discord params:', {
  frame_id: urlParams.get('frame_id'),
  instance_id: urlParams.get('instance_id'),
  channel_id: urlParams.get('channel_id'),
  guild_id: urlParams.get('guild_id'),
  activity_id: urlParams.get('activity_id'),
  application_id: urlParams.get('application_id'),
  launch_id: urlParams.get('launch_id')
});

// Check if in Discord iframe
console.log('In Discord iframe:', window.self !== window.top);
```

## 🐛 **Common Issues & Solutions**

### **Issue: No Authorization Prompt**
- **Cause:** Missing Discord Activity parameters
- **Solution:** Verify activity is launched from Discord voice channel

### **Issue: Token Exchange Fails**
- **Cause:** Missing client secret or incorrect endpoint
- **Solution:** Check environment variables and backend configuration

### **Issue: Activity Not Recognized**
- **Cause:** Incorrect activity configuration in Discord Developer Portal
- **Solution:** Verify activity URL and metadata settings

### **Issue: Infinite Loading**
- **Cause:** Event flow not properly connected
- **Solution:** Ensure event handlers are set up before SDK initialization

## 📊 **Success Metrics**

- [ ] **Local Development:** App loads in < 2 seconds, shows demo user
- [ ] **Discord Activity:** Authorization prompt appears within 3 seconds
- [ ] **Authentication:** User authenticated within 10 seconds
- [ ] **Activity Status:** Discord shows "Playing Connect 4" status
- [ ] **No Errors:** Console shows no error messages
- [ ] **Event Flow:** All expected events are emitted and received

## 🎯 **Next Steps**

1. **Verify Discord Application Configuration**
2. **Test Local Development Flow**
3. **Deploy to Discord-Compatible Domain**
4. **Test Discord Activity Launch**
5. **Verify OAuth2 Flow Works**
6. **Test Activity Status Updates**
7. **Document Any Remaining Issues**

## 📚 **Additional Resources**

- [Discord Developer Portal](https://discord.com/developers/applications)
- [Embedded App SDK Documentation](https://discord.com/developers/docs/developer-tools/embedded-app-sdk)
- [Activity Examples](https://github.com/discord/embedded-app-sdk-examples)
- [OAuth2 Scopes](https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes)
