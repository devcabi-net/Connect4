import { DiscordSDK } from '@discord/embedded-app-sdk';
import { EventEmitter } from '@core/EventEmitter';
import { DiscordUser } from '@core/types';

export interface DiscordConfig {
  clientId: string;
  scopes: string[];
  forceDiscordMode?: boolean; // For development testing
}

export class DiscordService extends EventEmitter {
  private sdk: DiscordSDK | null = null;
  private isConnected: boolean = false;
  private isDemo: boolean = false;
  private currentUser: DiscordUser | null = null;
  private config: DiscordConfig;

  constructor(config: DiscordConfig) {
    super();
    this.config = config;
  }

  async initialize(): Promise<boolean> {
    try {
      // Check if we're running in Discord (or forced Discord mode for testing)
      const shouldUseDiscord = this.isRunningInDiscord() || this.config.forceDiscordMode;
      
      if (!shouldUseDiscord) {
        console.log('🔧 Running in demo mode - Discord not detected');
        await this.initializeDemoMode();
        return true;
      }

      // Additional check: Only initialize Discord SDK if we have the required frame parameters
      const hasRequiredDiscordParams = this.hasRequiredDiscordParameters();
      
      if (!hasRequiredDiscordParams) {
        console.log('🔧 Discord detected but missing required parameters - falling back to demo mode');
        await this.initializeDemoMode();
        return true;
      }

      console.log('🎯 Initializing Discord SDK...');
      console.log('SDK Import check:', typeof DiscordSDK);
      
      if (this.config.forceDiscordMode) {
        console.log('🔧 Force Discord mode enabled - will attempt Discord auth even if not detected');
      }
      
      // Check if SDK is available
      if (typeof DiscordSDK === 'undefined') {
        throw new Error('Discord SDK not available - make sure @discord/embedded-app-sdk is properly imported');
      }
      
      // Initialize Discord SDK
      try {
        this.sdk = new DiscordSDK(this.config.clientId);
        console.log('📦 Discord SDK instance created with client ID:', this.config.clientId);
        
        // Wait for SDK to be ready (no timeout since authentication works)
        console.log('⏳ Waiting for Discord SDK to be ready...');
        await this.sdk.ready();
        console.log('✅ Discord SDK is ready');
      } catch (sdkError) {
        console.error('❌ Discord SDK initialization failed:', sdkError);
        
        // Always fall back to demo mode if Discord SDK fails
        console.log('🔧 Discord SDK failed - falling back to demo mode');
        await this.initializeDemoMode();
        return true;
      }

      // Proper Discord Activities OAuth2 authentication flow
      console.log('🔐 Starting Discord OAuth2 authentication flow...');
      
      try {
        // Step 1: Authorize with Discord to get an authorization code
        console.log('📝 Step 1: Requesting authorization from Discord...');
        console.log('Scopes:', this.config.scopes);
        
        const { code } = await this.sdk.commands.authorize({
          client_id: this.config.clientId,
          response_type: 'code',
          state: '',
          prompt: 'consent' as any, // Force authorization prompt
          scope: this.config.scopes as any, // Cast to any for SDK compatibility
        });
        
        console.log('✅ Authorization code received');
        
        // Step 2: Exchange the authorization code for an access token
        // Use Discord's proxy path for Activities
        console.log('🔑 Step 2: Exchanging code for access token...');
        
        const tokenResponse = await fetch('/.proxy/api/discord-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });
        
        if (!tokenResponse.ok) {
          const error = await tokenResponse.text();
          throw new Error(`Token exchange failed: ${error}`);
        }
        
        const { access_token } = await tokenResponse.json();
        console.log('✅ Access token received');
        
        // Step 3: Authenticate with the access token
        console.log('🎯 Step 3: Authenticating with Discord...');
        const auth = await this.sdk.commands.authenticate({
          access_token,
        });
        
        console.log('✅ Authentication successful');
        
        // Extract user information from auth response
        if (auth && auth.user) {
          this.currentUser = {
            id: auth.user.id,
            username: auth.user.username,
            discriminator: auth.user.discriminator || '0',
            avatar: auth.user.avatar ? 
              `https://cdn.discordapp.com/avatars/${auth.user.id}/${auth.user.avatar}.png?size=128` : 
              undefined,
            globalName: auth.user.global_name || auth.user.username
          };

          console.log('✅ Discord user authenticated:', this.currentUser);
          
          // Set up activity-specific features
          await this.setupActivity();
          
          this.isConnected = true;
          this.emit('connected', this.currentUser);
          
          // Set global flag to prevent HTML fallback from overriding successful auth
          if (typeof window !== 'undefined') {
            (window as any).discordUserConnected = true;
          }
          
          console.log(`✅ Discord connected: ${this.currentUser.username}`);
          return true;
        }

        // Authentication didn't return user info
        throw new Error('Discord authenticate() did not return user information');
        
      } catch (authError) {
        console.error('❌ Discord authentication failed:', authError);
        
        // Try to provide helpful debugging information
        if ((authError as any).code === 4006) {
          console.error('🔒 User declined authorization - falling back to demo mode');
        } else if ((authError as any).code === 4009) {
          console.error('🔑 No access token - Activity may need proper setup');
        }
        
        console.error('Falling back to demo mode...');
        throw authError;
      }

    } catch (error) {
      console.error('❌ Discord initialization failed:', error);
      console.error('Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      
      if (this.config.forceDiscordMode) {
        console.error('❌ Force Discord mode was enabled but authentication failed');
      }
      
      console.error('Debugging info:');
      console.error('- Current URL:', window.location.href);
      console.error('- User Agent:', navigator.userAgent);
      console.error('- Discord SDK available:', typeof window !== 'undefined' && 'DiscordSDK' in window);
      console.error('- Client ID:', this.config.clientId);
      
      // Fallback to demo mode
      console.log('🔧 Falling back to demo mode due to Discord auth failure');
      await this.initializeDemoMode();
      return true; // Return true since we successfully initialized demo mode
    }
  }

  private async initializeDemoMode(): Promise<void> {
    this.isDemo = true;
    this.isConnected = true;

    // Generate a more realistic demo user name
    const demoNames = [
      'Alex', 'Jordan', 'Casey', 'Riley', 'Taylor', 'Morgan', 'Quinn', 'Avery', 'Blake', 'Drew',
      'Sam', 'Jamie', 'Parker', 'Reese', 'Hayden', 'Peyton', 'Rowan', 'Sage', 'River', 'Sky'
    ];
    const randomName = demoNames[Math.floor(Math.random() * demoNames.length)];
    
    // Create a demo user
    this.currentUser = {
      id: `demo_${Math.random().toString(36).substr(2, 9)}`,
      username: `${randomName}${Math.floor(Math.random() * 100)}`,
      discriminator: '0000',
      globalName: randomName
    };

    console.log('🎮 Demo mode initialized');
    this.emit('connected', this.currentUser);
  }

  private hasRequiredDiscordParameters(): boolean {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      
      // Discord SDK requires these specific parameters to work properly
      const hasFrameId = urlParams.has('frame_id');
      const hasInstanceId = urlParams.has('instance_id');
      const hasChannelId = urlParams.has('channel_id');
      const hasGuildId = urlParams.has('guild_id');
      
      // Check if we're in a Discord iframe
      const isInDiscordFrame = typeof window !== 'undefined' && window.self !== window.top;
      
      // Check for Discord Activity specific parameters
      const hasActivityId = urlParams.has('activity_id');
      const hasApplicationId = urlParams.has('application_id');
      const hasLaunchId = urlParams.has('launch_id');
      
      // Check for discordsays.com domain (Discord Activity URLs)
      const isDiscordSaysDomain = window.location.hostname.includes('discordsays.com');
      
      console.log('🔍 Required Discord Parameters Check:', {
        hasFrameId,
        hasInstanceId,
        hasChannelId,
        hasGuildId,
        isInDiscordFrame,
        hasActivityId,
        hasApplicationId,
        hasLaunchId,
        isDiscordSaysDomain,
        hasRequiredParams: hasFrameId || hasInstanceId || hasChannelId || hasGuildId || 
                          isInDiscordFrame || hasActivityId || hasApplicationId || 
                          hasLaunchId || isDiscordSaysDomain
      });
      
      // Return true if we have the essential Discord parameters
      return hasFrameId || hasInstanceId || hasChannelId || hasGuildId || 
             isInDiscordFrame || hasActivityId || hasApplicationId || 
             hasLaunchId || isDiscordSaysDomain;
    } catch (error) {
      console.error('Error checking required Discord parameters:', error);
      return false;
    }
  }

  private isRunningInDiscord(): boolean {
    try {
      console.log('🔍 Starting Discord detection...');
      console.log('Current URL:', window.location.href);
      console.log('User Agent:', navigator.userAgent);
      
      // Check multiple Discord indicators
      const urlParams = new URLSearchParams(window.location.search);
      
      // Force Discord mode for testing (can be enabled via URL parameter)
      const forceDiscordParam = urlParams.get('force_discord');
      const forceDiscordMode = forceDiscordParam === 'true' || this.config.forceDiscordMode;
      
      console.log('🔧 URL Parameter Debug:', {
        search: window.location.search,
        forceDiscordParam,
        forceDiscordParamType: typeof forceDiscordParam,
        forceDiscordParamValue: forceDiscordParam,
        configForceMode: this.config.forceDiscordMode,
        finalForceMode: forceDiscordMode
      });
      
      console.log('🔧 Force Discord Mode Check:', {
        forceDiscordParam,
        configForceMode: this.config.forceDiscordMode,
        finalForceMode: forceDiscordMode
      });
      
      // Primary check: Discord SDK is available
      const hasDiscordSDK = typeof window !== 'undefined' && 
                           ('DiscordSDK' in window || this.sdk !== null);
      
      // Secondary checks: Discord-specific parameters
      const hasDiscordFrameId = urlParams.has('frame_id');
      const hasDiscordInstanceId = urlParams.has('instance_id');
      const hasDiscordChannelId = urlParams.has('channel_id');
      const hasDiscordGuildId = urlParams.has('guild_id');
      
      // Tertiary check: Running in Discord iframe
      const isInDiscordFrame = typeof window !== 'undefined' && 
                              window.self !== window.top;
      
      // Check referrer and ancestor origins for Discord
      const hasDiscordReferrer = document.referrer.includes('discord');
      const hasDiscordAncestor = window.location.ancestorOrigins?.[0]?.includes('discord');
      
      // Quaternary check: Explicit client_id parameter (Activity Test Mode)
      const hasClientId = urlParams.has('client_id');
      
      // Check for Discord's user agent or environment indicators
      const hasDiscordUserAgent = typeof navigator !== 'undefined' && 
                                  navigator.userAgent.toLowerCase().includes('discord');
      
      // Discord Activity specific checks
      const hasDiscordActivity = urlParams.has('activity_id') || urlParams.has('application_id');
      
      // Check for discordsays.com domain (Discord Activity URLs)
      const isDiscordSaysDomain = window.location.hostname.includes('discordsays.com');
      
      // Check for launch_id (Activity launch parameter)
      const hasLaunchId = urlParams.has('launch_id');
      
      // Return true if ANY Discord indicator is present OR force mode is enabled
      const isDiscord = forceDiscordMode || hasDiscordSDK || hasDiscordFrameId || hasDiscordInstanceId || 
                       hasDiscordChannelId || hasDiscordGuildId || isInDiscordFrame || 
                       hasClientId || hasDiscordUserAgent || hasDiscordReferrer || 
                       hasDiscordAncestor || hasDiscordActivity || isDiscordSaysDomain || 
                       hasLaunchId;
      
      console.log('🔍 Discord Detection Results:', {
        url: window.location.href,
        hasDiscordSDK,
        hasDiscordFrameId,
        hasDiscordInstanceId,
        hasDiscordChannelId,
        hasDiscordGuildId,
        isInDiscordFrame,
        hasDiscordReferrer,
        hasDiscordAncestor,
        hasClientId,
        hasDiscordUserAgent,
        hasDiscordActivity,
        isDiscordSaysDomain,
        hasLaunchId,
        forceMode: forceDiscordMode,
        finalResult: isDiscord
      });
      
      return isDiscord;
    } catch (error) {
      console.error('Error during Discord detection:', error);
      return false;
    }
  }

  private async setupActivity(): Promise<void> {
    if (!this.sdk || this.isDemo) return;

    try {
      await this.sdk.commands.setActivity({
        activity: {
          type: 0, // Playing
          details: 'Playing board games',
          state: 'In lobby',
          timestamps: {
            start: Date.now()
          },
          assets: {
            large_image: 'game_lobby',
            large_text: 'Discord Game Hub'
          },
          instance: true
        }
      });

      console.log('✅ Discord activity set');
    } catch (error) {
      console.warn('⚠️ Failed to set Discord activity:', error);
    }
  }

  async updateActivity(details: string, state?: string): Promise<void> {
    if (!this.sdk || this.isDemo) return;

    try {
      await this.sdk.commands.setActivity({
        activity: {
          type: 0, // Playing
          details,
          state: state || 'In game',
          timestamps: {
            start: Date.now()
          },
          assets: {
            large_image: 'game_lobby',
            large_text: 'Discord Game Hub'
          },
          instance: true
        }
      });
    } catch (error) {
      console.warn('⚠️ Failed to update Discord activity:', error);
    }
  }

  getCurrentUser(): DiscordUser | null {
    return this.currentUser;
  }

  isConnectedToDiscord(): boolean {
    return this.isConnected;
  }

  isDemoMode(): boolean {
    return this.isDemo;
  }

  async getChannelInfo(): Promise<any> {
    if (!this.sdk || this.isDemo) {
      return {
        id: 'demo_channel',
        name: 'Demo Voice Channel',
        type: 'voice'
      };
    }

    try {
      // Note: In Discord Activities, we don't need to specify channel_id
      // The SDK should provide the current channel context
      console.warn('⚠️ getChannel requires channel_id in current SDK version');
      return null;
    } catch (error) {
      console.warn('⚠️ Failed to get channel info:', error);
      return null;
    }
  }

  async getGuildInfo(): Promise<any> {
    if (!this.sdk || this.isDemo) {
      return {
        id: 'demo_guild',
        name: 'Demo Server'
      };
    }

    try {
      // Note: getGuild is not available in current SDK version
      console.warn('⚠️ getGuild not available in current SDK');
      return null;
    } catch (error) {
      console.warn('⚠️ Failed to get guild info:', error);
      return null;
    }
  }

  // WebSocket-like message broadcasting (simplified)
  broadcastMessage(type: string, data: any): void {
    // In a real implementation, this would use Discord's message system
    // For now, we'll use the EventEmitter pattern
    this.emit('message', { type, data, timestamp: new Date() });
  }

  onMessage(callback: (message: any) => void): void {
    this.on('message', callback);
  }

  disconnect(): void {
    if (this.sdk) {
      // SDK doesn't have a disconnect method, but we can clean up
      this.sdk = null;
    }
    
    this.isConnected = false;
    this.currentUser = null;
    this.emit('disconnected');
    
    console.log('🔌 Disconnected from Discord');
  }
}
