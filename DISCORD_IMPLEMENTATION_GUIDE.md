# 🎯 Discord Embedded App SDK - Standardized Implementation Guide

## 📚 **Official Documentation References**

- **Embedded App SDK Docs:** https://discord.com/developers/docs/developer-tools/embedded-app-sdk
- **Activity Examples:** https://github.com/discord/embedded-app-sdk-examples
- **Starter Template:** https://github.com/discord/embedded-app-sdk-examples/tree/main/discord-activity-starter

## 🔧 **Standard Implementation Flow**

### **Step 1: SDK Initialization**
```typescript
import { DiscordSDK } from '@discord/embedded-app-sdk';

// Create SDK instance with your client ID
const discordSdk = new DiscordSDK(YOUR_CLIENT_ID);

// Wait for SDK to be ready
await discordSdk.ready();
```

### **Step 2: OAuth2 Authorization Flow**
```typescript
// Request authorization from Discord
const { code } = await discordSdk.commands.authorize({
  client_id: YOUR_CLIENT_ID,
  response_type: 'code',
  state: '',
  prompt: 'none', // Use 'none' for better UX
  scope: ['identify', 'guilds'], // Required scopes
});
```

### **Step 3: Token Exchange**
```typescript
// Exchange code for access token via your backend
const response = await fetch('/api/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code }),
});

const { access_token } = await response.json();
```

### **Step 4: Authenticate with Discord**
```typescript
// Authenticate using the access token
const auth = await discordSdk.commands.authenticate({
  access_token,
});

if (auth == null) {
  throw new Error('Authenticate command failed');
}

// Extract user information
const user = auth.user;
```

## 🚨 **Critical Requirements**

### **1. Environment Detection**
- **Discord Activities:** Must run in Discord iframe with proper parameters
- **Local Development:** Should fall back to demo mode
- **URL Parameters:** Check for `frame_id`, `instance_id`, `channel_id`, `guild_id`

### **2. OAuth2 Configuration**
- **Client ID:** Must match Discord Developer Portal
- **Client Secret:** Required for token exchange (server-side only)
- **Redirect URLs:** Must be configured in Discord Developer Portal
- **Scopes:** `identify`, `guilds` are minimum required

### **3. Content Security Policy**
- **Discord Activities:** Cannot make external API calls
- **Token Exchange:** Must use Discord's proxy or internal endpoint
- **CORS:** Must allow Discord domains

## 🐛 **Common Issues & Solutions**

### **Issue: No Authorization Prompt**
- **Cause:** Missing or incorrect OAuth2 configuration
- **Solution:** Verify client ID, scopes, and redirect URLs

### **Issue: Infinite Loading**
- **Cause:** Event flow not properly connected
- **Solution:** Ensure event handlers are set up before SDK initialization

### **Issue: Token Exchange Fails**
- **Cause:** Missing client secret or incorrect endpoint
- **Solution:** Verify backend configuration and environment variables

## 📋 **Implementation Checklist**

- [ ] Discord SDK properly imported and initialized
- [ ] OAuth2 flow follows official documentation exactly
- [ ] Event handlers set up before SDK initialization
- [ ] Proper fallback to demo mode for local development
- [ ] Error handling for all authentication steps
- [ ] User information properly extracted and stored
- [ ] Loading states properly managed
- [ ] Console logging for debugging

## 🔍 **Testing Strategy**

### **Local Development**
1. Test demo mode fallback
2. Verify event flow works
3. Check console logs for errors

### **Discord Activity**
1. Deploy to Discord-compatible domain
2. Test OAuth2 flow
3. Verify user authentication
4. Check activity status updates

## 📁 **File Structure**
```
src/
├── services/
│   └── DiscordService.ts    # Discord SDK integration
├── core/
│   └── GameHub.ts          # Game management
└── ui/
    └── App.ts              # UI management
```

## 🎯 **Next Steps**
1. Implement standardized Discord service
2. Test local development flow
3. Deploy and test Discord activity
4. Document any remaining issues
