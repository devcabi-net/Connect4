# 🎮 Connect4 Discord Activity - Complete Setup Guide

## 🌐 **Standardized URL: `disconnect4.netlify.app`**

Your app is deployed at: https://disconnect4.netlify.app  
Custom domain: https://cordcabi.net (redirects to Netlify)

---

## ✅ **Current Configuration Status**

### **Netlify Environment Variables (CONFIRMED SET):**
```
✅ DISCORD_CLIENT_ID = 1407945986424307713
✅ DISCORD_CLIENT_SECRET = j5_Tbd_rZQIJH9T5Tvy-B60gR_3ShjaL  
✅ VITE_DISCORD_CLIENT_ID = 1407945986424307713
✅ VITE_SUPABASE_URL = https://uncywyqqgqwrkgjllkna.supabase.co
✅ VITE_SUPABASE_ANON_KEY = [JWT token set]
```

### **Site Details:**
- **Site Name:** disconnect4
- **Site ID:** ba2defac-75d6-4ae9-9540-7d2e4a5c56c8
- **Primary URL:** https://disconnect4.netlify.app
- **Custom Domain:** https://cordcabi.net
- **Deploy Status:** Ready

---

## 🔧 **Files That Need URL Updates**

### **1. Discord Developer Portal**
Go to: https://discord.com/developers/applications/1407945986424307713

**Activity URL Mappings (CRITICAL):**
#### Root Mapping (REQUIRED):
- **PREFIX:** (leave empty - Discord shows "/" placeholder)
- **TARGET:** `disconnect4.netlify.app` (just domain, no https://)

#### Proxy Path Mappings (DELETE ALL):
- **Click the X to remove any proxy mappings**
- We don't need them - Discord CSP blocks external requests anyway
- The `/` → `cordcabi.net` mapping is WRONG and must be removed

**OAuth2 Redirect URLs:**
- Not needed for Discord Activities (authentication happens within Discord)

### **2. No Code Changes Needed**
The authentication is simplified and doesn't use hardcoded URLs anymore. All references to external domains have been removed due to CSP restrictions.

---

## 🚀 **Quick Start Commands**

### **Local Development:**
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### **Deploy to Netlify:**
```bash
# Automatic via GitHub push
git add .
git commit -m "Update"
git push

# Or manual deploy
netlify deploy --prod --dir=dist
```

---

## 🎯 **How Discord Activities Work**

### **Authentication Flow (Simplified):**
```javascript
// 1. SDK Initialization
const sdk = new DiscordSDK(clientId);
await sdk.ready();

// 2. Authentication (returns user directly)
const auth = await sdk.commands.authenticate({});
const user = auth.user; // {id, username, avatar}
```

### **Why External URLs Don't Work:**
Discord Activities have strict Content Security Policy (CSP):
- ✅ **Allowed:** Discord domains, CDN domains
- ❌ **Blocked:** External domains like cordcabi.net, disconnect4.netlify.app

---

## 🐛 **Current Issues & Solutions**

### **Problem: "Demo User" Still Appears**

**Diagnosis Steps:**
1. Open Discord Developer Tools (Ctrl+Shift+I in Discord)
2. Launch the activity
3. Check Console for errors

**Common Errors:**
- `authenticate() did not return user info` - Discord SDK issue
- `CSP violation` - External domain access blocked
- `SDK ready timeout` - Network/loading issue

**Solutions:**
1. **Clear Discord Cache:**
   - Settings → Advanced → Clear Cache
   - Restart Discord

2. **Check Activity Configuration:**
   - Ensure URL mappings are correct
   - Client ID matches (1407945986424307713)
   
3. **Force Refresh:**
   - In activity, press Ctrl+F5
   - Or close and relaunch activity

---

## 📁 **Project Structure**

```
Connect4/
├── src/
│   ├── services/
│   │   ├── DiscordService.ts    # Discord SDK integration
│   │   └── SupabaseService.ts   # Disabled in Activities (CSP)
│   ├── core/
│   │   └── GameHub.ts          # Game management
│   └── ui/
│       └── ActivityUI.ts       # Modern Discord-themed UI
├── dist/                        # Build output (git ignored)
├── netlify/
│   └── functions/
│       └── token.js            # Not used anymore (CSP blocks)
└── netlify.toml                # Netlify configuration
```

---

## 🛠️ **Testing Checklist**

### **Discord Activity Launch:**
- [ ] Activity launches without errors
- [ ] No CSP violations in console
- [ ] Authentication prompt appears (if first time)
- [ ] Real Discord username shown
- [ ] Real Discord avatar displayed

### **Game Functionality:**
- [ ] Create game works
- [ ] Game board renders
- [ ] Moves register correctly
- [ ] Win detection works
- [ ] Can start new game

---

## 💡 **Key Points to Remember**

1. **No External HTTP Calls** - Discord CSP blocks them
2. **Use Discord SDK Only** - For user data and authentication
3. **URL Doesn't Matter** - Activity runs in Discord's domain
4. **Simplified Auth** - Just `authenticate()`, no OAuth2 flow
5. **Local Storage Only** - No external database in Activities

---

## 📞 **Quick Debug Commands**

### **Check Netlify Status:**
```bash
netlify status
netlify env:list
netlify deploy --prod --dir=dist
```

### **Check Git Status:**
```bash
git status
git log --oneline -5
git remote -v
```

### **Check Build:**
```bash
npm run build
npx tsc --noEmit  # TypeScript check
```

---

## 🔗 **Important Links**

- **Your App:** https://disconnect4.netlify.app
- **Netlify Dashboard:** https://app.netlify.com/sites/disconnect4
- **Discord App:** https://discord.com/developers/applications/1407945986424307713
- **GitHub Repo:** https://github.com/devcabi-net/Connect4

---

## ⚡ **Next Steps to Fix Authentication**

1. **Update Discord Activity URL Mappings** (most important):
   ```
   Production: /.proxy/https://disconnect4.netlify.app → /
   ```

2. **Test in Discord:**
   - Launch activity from your test server
   - Check console for specific error
   - Share the exact error message

3. **If Still Failing:**
   - The issue is likely in Discord's Activity configuration
   - Not in the code (code is simplified and correct)
   - May need to recreate the Discord application

---

## 📝 **Environment Variables Summary**

**Required in Netlify Dashboard:**
```env
DISCORD_CLIENT_ID=1407945986424307713
DISCORD_CLIENT_SECRET=j5_Tbd_rZQIJH9T5Tvy-B60gR_3ShjaL
VITE_DISCORD_CLIENT_ID=1407945986424307713
VITE_SUPABASE_URL=https://uncywyqqgqwrkgjllkna.supabase.co
VITE_SUPABASE_ANON_KEY=[your key]
```

All are currently set correctly in your Netlify deployment.

---

**Last Updated:** January 27, 2025
**Deployment URL:** https://disconnect4.netlify.app
**Status:** Code deployed, Discord Activity configuration needs verification
