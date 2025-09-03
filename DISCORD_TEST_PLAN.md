# 🧪 Discord Implementation Test Plan

## 🎯 **Test Objectives**
1. Verify Discord SDK initialization works
2. Verify OAuth2 authorization flow works
3. Verify event propagation from Discord service to UI
4. Verify fallback to demo mode works
5. Verify no infinite loading states

## 🔧 **Test Environment Setup**

### **Local Development Testing**
- **URL:** `http://localhost:3000` or `https://localhost:3001`
- **Expected Behavior:** Should immediately fall back to demo mode
- **Success Criteria:** App loads in < 2 seconds, shows demo user

### **Discord Activity Testing**
- **URL:** Deployed to Discord-compatible domain
- **Expected Behavior:** Should attempt Discord OAuth2 flow
- **Success Criteria:** Shows authorization prompt, authenticates user

## 📋 **Test Cases**

### **Test Case 1: Local Development Demo Mode**
1. **Setup:** Start dev server, open in browser
2. **Expected Console Output:**
   ```
   🚀 Initializing Discord Game Hub...
   🎮 Initializing Discord service...
   🚀 DiscordService.initialize() called
   🔍 Checking if running in Discord...
   🔍 Discord detection results: { hasDiscordParams: false, isInDiscordFrame: false, hasDiscordDomain: false, hasDiscordReferrer: false, finalResult: false }
   🔧 Not running in Discord - falling back to demo mode
   🎮 Initializing demo mode...
   🎮 Demo mode initialized with user: { id: "demo_...", username: "...", ... }
   🎯 Emitting connected event for demo user
   ✅ Demo mode setup complete
   🎯 GameHub received connected event from DiscordService: { id: "demo_...", username: "...", ... }
   🎯 GameHub emitting playerConnected event: { id: "demo_...", name: "...", ... }
   👤 Player connected: [username]
   🎯 About to call app.setPlayer with: { id: "demo_...", name: "...", ... }
   🎯 app.setPlayer completed
   ```
3. **Expected UI:** Welcome screen with demo user
4. **Success Criteria:** No loading screen, demo user displayed

### **Test Case 2: Discord OAuth2 Flow (When in Discord)**
1. **Setup:** Deploy to Discord domain, launch as Discord Activity
2. **Expected Console Output:**
   ```
   🚀 Initializing Discord Game Hub...
   🎮 Initializing Discord service...
   🚀 DiscordService.initialize() called
   🔍 Checking if running in Discord...
   🔍 Discord detection results: { hasDiscordParams: true, isInDiscordFrame: true, hasDiscordDomain: true, hasDiscordReferrer: true, finalResult: true }
   🎯 Running in Discord mode - initializing Discord SDK
   ✅ Discord SDK instance created
   ⏳ Waiting for Discord SDK to be ready...
   ✅ Discord SDK is ready
   🔐 Starting OAuth2 authorization flow...
   ✅ Authorization code received: YES
   🔑 Exchanging authorization code for access token...
   ✅ Access token received: YES
   🎯 Authenticating with Discord using access token...
   ✅ Discord authentication successful
   👤 User info received: { id: "...", username: "...", global_name: "..." }
   🎯 Emitting connected event with user: { id: "...", username: "...", ... }
   ✅ Discord connection complete
   🎯 GameHub received connected event from DiscordService: { id: "...", username: "...", ... }
   🎯 GameHub emitting playerConnected event: { id: "...", name: "...", ... }
   👤 Player connected: [username]
   🎯 About to call app.setPlayer with: { id: "...", name: "...", ... }
   🎯 app.setPlayer completed
   ```
3. **Expected UI:** Welcome screen with real Discord user
4. **Success Criteria:** Discord authorization prompt, real user displayed

### **Test Case 3: Discord SDK Failure Fallback**
1. **Setup:** Simulate Discord SDK failure (e.g., wrong client ID)
2. **Expected Console Output:**
   ```
   🚀 Initializing Discord Game Hub...
   🎮 Initializing Discord service...
   🚀 DiscordService.initialize() called
   🔍 Checking if running in Discord...
   🔍 Discord detection results: { hasDiscordParams: true, isInDiscordFrame: true, hasDiscordDomain: true, hasDiscordReferrer: true, finalResult: true }
   🎯 Running in Discord mode - initializing Discord SDK
   ❌ Discord SDK error: [error details]
   🔧 Falling back to demo mode due to Discord SDK failure
   🎮 Initializing demo mode...
   🎮 Demo mode initialized with user: { id: "demo_...", username: "...", ... }
   🎯 Emitting connected event for demo user
   ✅ Demo mode setup complete
   [rest of demo mode flow...]
   ```
3. **Expected UI:** Welcome screen with demo user
4. **Success Criteria:** Graceful fallback, no errors

### **Test Case 4: Event Handler Timing**
1. **Setup:** Verify event handlers are set up before SDK initialization
2. **Expected Console Output:**
   ```
   🎯 GameHub setting up event handlers
   🎯 GameHub event handlers set up. Discord service listeners: { hasConnectedListener: 1, hasDisconnectedListener: 1 }
   🚀 Initializing Game Hub...
   🎮 Initializing Discord service...
   🚀 DiscordService.initialize() called
   ```
3. **Success Criteria:** Event handlers registered before any events are emitted

## 🚨 **Common Failure Points**

### **1. No Authorization Prompt**
- **Symptoms:** App loads but no Discord auth dialog
- **Possible Causes:**
  - Discord detection logic too strict
  - Missing Discord URL parameters
  - Running in wrong environment
- **Debug Steps:**
  - Check console for Discord detection results
  - Verify URL parameters
  - Check if running in Discord iframe

### **2. Infinite Loading**
- **Symptoms:** App stuck on "Connecting to Discord..." screen
- **Possible Causes:**
  - Event handlers not set up
  - Discord service not emitting events
  - UI not responding to events
- **Debug Steps:**
  - Check console for event flow
  - Verify event handler registration
  - Check if connected event is emitted

### **3. Token Exchange Failure**
- **Symptoms:** Authorization succeeds but authentication fails
- **Possible Causes:**
  - Missing client secret
  - Incorrect token exchange endpoint
  - CORS issues
- **Debug Steps:**
  - Check network tab for token exchange request
  - Verify backend configuration
  - Check environment variables

## 🔍 **Debugging Commands**

### **Check Event Listeners**
```javascript
// In browser console
const gameHub = window.gameHub; // If exposed globally
console.log('GameHub listeners:', gameHub.listenerCount('playerConnected'));
console.log('DiscordService listeners:', gameHub.getDiscordService().listenerCount('connected'));
```

### **Force Discord Mode**
```javascript
// Add to URL for testing
?force_discord=true
```

### **Check Discord Detection**
```javascript
// In browser console
const urlParams = new URLSearchParams(window.location.search);
console.log('Discord params:', {
  frame_id: urlParams.get('frame_id'),
  instance_id: urlParams.get('instance_id'),
  channel_id: urlParams.get('channel_id'),
  guild_id: urlParams.get('guild_id')
});
console.log('In iframe:', window.self !== window.top);
```

## 📊 **Success Metrics**
- **Local Development:** App loads in < 2 seconds
- **Discord Activity:** Authorization prompt appears within 3 seconds
- **Authentication:** User authenticated within 10 seconds
- **Fallback:** Demo mode activates within 5 seconds if Discord fails
- **No Errors:** Console shows no error messages
- **Event Flow:** All expected events are emitted and received

## 🎯 **Next Steps After Testing**
1. Document any remaining issues
2. Optimize performance if needed
3. Add additional error handling
4. Create user documentation
5. Deploy to production Discord environment
