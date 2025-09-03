import { DiscordSDK } from '@discord/embedded-app-sdk';
import { EventEmitter } from '@core/EventEmitter';
import { DiscordUser } from '@core/types';

export interface DiscordConfig {
  clientId: string;
  scopes: string[];
  forceDiscordMode?: boolean;
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
      console.log('🚀 DiscordService.initialize() called');
      
      // In production, always try Discord mode first unless explicitly disabled
      const isProduction = import.meta.env.PROD || window.location.hostname.includes('netlify.app');
      const shouldUseDiscord = this.isRunningInDiscord() || this.config.forceDiscordMode || isProduction;
      
      console.log('🔧 Discord mode decision:', {
        isRunningInDiscord: this.isRunningInDiscord(),
        forceDiscordMode: this.config.forceDiscordMode,
        isProduction,
        shouldUseDiscord
      });
      
      if (!shouldUseDiscord) {
        console.log('🔧 Not using Discord mode - falling back to demo mode');
        await this.initializeDemoMode();
        return true;
      }

      console.log('🎯 Running in Discord mode - initializing Discord SDK');
      
      // Step 1: Initialize Discord SDK
      try {
        console.log('🎯 Creating Discord SDK instance with client ID:', this.config.clientId);
        console.log('🔧 Environment variables:', {
          VITE_DISCORD_CLIENT_ID: import.meta.env.VITE_DISCORD_CLIENT_ID,
          VITE_FORCE_DISCORD_MODE: import.meta.env.VITE_FORCE_DISCORD_MODE,
          MODE: import.meta.env.MODE,
          PROD: import.meta.env.PROD,
          DEV: import.meta.env.DEV
        });
        this.sdk = new DiscordSDK(this.config.clientId);
        console.log('✅ Discord SDK instance created');
        
        // Step 2: Wait for SDK to be ready
        console.log('⏳ Waiting for Discord SDK to be ready...');
        try {
          await this.sdk.ready();
          console.log('✅ Discord SDK is ready');
        } catch (readyError) {
          console.error('❌ Discord SDK ready() failed:', readyError);
          throw new Error(`SDK ready failed: ${readyError}`);
        }
        
        // Step 3: Start OAuth2 authorization flow
        console.log('🔐 Starting OAuth2 authorization flow...');
        console.log('🔐 Authorization parameters:', {
          client_id: this.config.clientId,
          response_type: 'code',
          state: '',
          prompt: 'none',
          scope: this.config.scopes
        });
        
        let code: string;
        try {
          const authResponse = await this.sdk.commands.authorize({
            client_id: this.config.clientId,
            response_type: 'code',
            state: '',
            prompt: 'none',
            scope: this.config.scopes as any, // Cast to any for SDK compatibility
          });
          
          code = authResponse.code;
          console.log('✅ Authorization code received:', code ? 'YES' : 'NO');
          
          if (!code) {
            throw new Error('No authorization code received from Discord');
          }
        } catch (authError) {
          console.error('❌ Discord authorization failed:', authError);
          throw new Error(`Authorization failed: ${authError}`);
        }
        
        // Step 4: Exchange code for access token
        console.log('🔑 Exchanging authorization code for access token...');
        let access_token: string;
        
        try {
          const tokenResponse = await fetch('/.proxy/api/discord-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          });
          
          if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`);
          }
          
          const tokenData = await tokenResponse.json();
          access_token = tokenData.access_token;
          console.log('✅ Access token received:', access_token ? 'YES' : 'NO');
          
          if (!access_token) {
            throw new Error('No access token received from token exchange');
          }
        } catch (tokenError) {
          console.error('❌ Token exchange failed:', tokenError);
          throw new Error(`Token exchange failed: ${tokenError}`);
        }
        
        // Step 5: Authenticate with Discord using access token
        console.log('🎯 Authenticating with Discord using access token...');
        let auth: any;
        
        try {
          auth = await this.sdk.commands.authenticate({
            access_token,
          });
          
          if (auth == null) {
            throw new Error('Discord authenticate() returned null');
          }
          
          if (!auth.user) {
            throw new Error('Discord authenticate() did not return user information');
          }
        } catch (authError) {
          console.error('❌ Discord authentication failed:', authError);
          throw new Error(`Authentication failed: ${authError}`);
        }
        
        console.log('✅ Discord authentication successful');
        console.log('👤 User info received:', {
          id: auth.user.id,
          username: auth.user.username,
          global_name: auth.user.global_name
        });
        
        // Extract and store user information
        this.currentUser = {
          id: auth.user.id,
          username: auth.user.username,
          discriminator: auth.user.discriminator || '0',
          avatar: auth.user.avatar ? 
            `https://cdn.discordapp.com/avatars/${auth.user.id}/${auth.user.avatar}.png?size=128` : 
            undefined,
          globalName: auth.user.global_name || auth.user.username
        };
        
        // Set up activity and emit connected event
        await this.setupActivity();
        this.isConnected = true;
        
        console.log('🎯 Emitting connected event with user:', this.currentUser);
        this.emit('connected', this.currentUser);
        
        console.log('✅ Discord connection complete');
        return true;
        
      } catch (sdkError) {
        console.error('❌ Discord SDK error:', sdkError);
        console.log('🔧 Falling back to demo mode due to Discord SDK failure');
        await this.initializeDemoMode();
        return true;
      }
      
    } catch (error) {
      console.error('❌ DiscordService initialization failed:', error);
      console.log('🔧 Falling back to demo mode due to initialization failure');
      await this.initializeDemoMode();
      return true;
    }
  }

  private async initializeDemoMode(): Promise<void> {
    console.log('🎮 Initializing demo mode...');
    
    this.isDemo = true;
    this.isConnected = true;

    // Generate demo user
    const demoNames = [
      'Alex', 'Jordan', 'Casey', 'Riley', 'Taylor', 'Morgan', 'Quinn', 'Avery', 'Blake', 'Drew'
    ];
    const randomName = demoNames[Math.floor(Math.random() * demoNames.length)];
    
    this.currentUser = {
      id: `demo_${Math.random().toString(36).substr(2, 9)}`,
      username: `${randomName}${Math.floor(Math.random() * 100)}`,
      discriminator: '0000',
      globalName: randomName
    };

    console.log('🎮 Demo mode initialized with user:', this.currentUser);
    console.log('🎯 Emitting connected event for demo user');
    this.emit('connected', this.currentUser);
    console.log('✅ Demo mode setup complete');
  }

  private isRunningInDiscord(): boolean {
    try {
      console.log('🔍 Checking if running in Discord...');
      
      // Check URL parameters for Discord Activity launch indicators
      // According to Discord docs: https://discord.com/developers/docs/activities/building-an-activity
      const urlParams = new URLSearchParams(window.location.search);
      
      // Critical Discord Activity parameters
      const hasFrameId = urlParams.has('frame_id');
      const hasInstanceId = urlParams.has('instance_id');
      const hasChannelId = urlParams.has('channel_id');
      const hasGuildId = urlParams.has('guild_id');
      const hasActivityId = urlParams.has('activity_id');
      const hasApplicationId = urlParams.has('application_id');
      const hasLaunchId = urlParams.has('launch_id');
      
      // Check if running in Discord iframe (most reliable indicator)
      const isInDiscordFrame = window.self !== window.top;
      
      // Check for Discord domains
      const hasDiscordDomain = window.location.hostname.includes('discord') ||
                              window.location.hostname.includes('discordsays.com');
      
      // Check referrer for Discord
      const hasDiscordReferrer = document.referrer.includes('discord');
      
      // Check for Discord user agent (mobile apps)
      const hasDiscordUserAgent = navigator.userAgent.includes('Discord');
      
      // Check for Discord environment variables
      const hasDiscordEnv = typeof window !== 'undefined' && 
                           (window as any).DiscordNative !== undefined;
      
      // Check if this looks like a Discord Activity launch
      // Activities are often launched with specific referrers or in iframes
      const hasDiscordActivityIndicators = isInDiscordFrame || hasDiscordReferrer || 
                                          hasDiscordDomain || hasDiscordUserAgent;
      
      // Discord Activity detection logic
      const hasDiscordActivityParams = hasFrameId || hasInstanceId || hasChannelId || 
                                     hasGuildId || hasActivityId || hasApplicationId || 
                                     hasLaunchId;
      
      // Be more permissive - if we have any Discord indicators, try Discord mode
      const isDiscord = hasDiscordActivityParams || hasDiscordActivityIndicators || hasDiscordEnv;
      
      console.log('🔍 Discord detection results:', {
        // Activity parameters
        hasFrameId,
        hasInstanceId,
        hasChannelId,
        hasGuildId,
        hasActivityId,
        hasApplicationId,
        hasLaunchId,
        hasDiscordActivityParams,
        
        // Environment indicators
        isInDiscordFrame,
        hasDiscordDomain,
        hasDiscordReferrer,
        hasDiscordUserAgent,
        hasDiscordEnv,
        hasDiscordActivityIndicators,
        
        // Final result
        finalResult: isDiscord
      });
      
      // Log URL for debugging
      console.log('🔍 Current URL:', window.location.href);
      console.log('🔍 URL parameters:', Object.fromEntries(urlParams.entries()));
      console.log('🔍 Document referrer:', document.referrer);
      
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

  disconnect(): void {
    if (this.sdk) {
      this.sdk = null;
    }
    
    this.isConnected = false;
    this.currentUser = null;
    this.emit('disconnected');
    
    console.log('🔌 Disconnected from Discord');
  }
}
