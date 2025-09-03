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
      
      // Check if we should use Discord mode
      const shouldUseDiscord = this.isRunningInDiscord() || this.config.forceDiscordMode;
      
      if (!shouldUseDiscord) {
        console.log('🔧 Not running in Discord - falling back to demo mode');
        await this.initializeDemoMode();
        return true;
      }

      console.log('🎯 Running in Discord mode - initializing Discord SDK');
      
      // Step 1: Initialize Discord SDK
      try {
        this.sdk = new DiscordSDK(this.config.clientId);
        console.log('✅ Discord SDK instance created');
        
        // Step 2: Wait for SDK to be ready
        console.log('⏳ Waiting for Discord SDK to be ready...');
        await this.sdk.ready();
        console.log('✅ Discord SDK is ready');
        
        // Step 3: Start OAuth2 authorization flow
        console.log('🔐 Starting OAuth2 authorization flow...');
        const { code } = await this.sdk.commands.authorize({
          client_id: this.config.clientId,
          response_type: 'code',
          state: '',
          prompt: 'none',
          scope: this.config.scopes as any, // Cast to any for SDK compatibility
        });
        
        console.log('✅ Authorization code received:', code ? 'YES' : 'NO');
        
        if (!code) {
          throw new Error('No authorization code received from Discord');
        }
        
        // Step 4: Exchange code for access token
        console.log('🔑 Exchanging authorization code for access token...');
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
        
        const { access_token } = await tokenResponse.json();
        console.log('✅ Access token received:', access_token ? 'YES' : 'NO');
        
        if (!access_token) {
          throw new Error('No access token received from token exchange');
        }
        
        // Step 5: Authenticate with Discord using access token
        console.log('🎯 Authenticating with Discord using access token...');
        const auth = await this.sdk.commands.authenticate({
          access_token,
        });
        
        if (auth == null) {
          throw new Error('Discord authenticate() returned null');
        }
        
        if (!auth.user) {
          throw new Error('Discord authenticate() did not return user information');
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
      
      // Check URL parameters for Discord indicators
      const urlParams = new URLSearchParams(window.location.search);
      const hasDiscordParams = urlParams.has('frame_id') || 
                              urlParams.has('instance_id') || 
                              urlParams.has('channel_id') || 
                              urlParams.has('guild_id') ||
                              urlParams.has('activity_id') ||
                              urlParams.has('application_id') ||
                              urlParams.has('launch_id');
      
      // Check if running in Discord iframe
      const isInDiscordFrame = window.self !== window.top;
      
      // Check for Discord domain
      const hasDiscordDomain = window.location.hostname.includes('discord') ||
                              window.location.hostname.includes('discordsays.com');
      
      // Check referrer
      const hasDiscordReferrer = document.referrer.includes('discord');
      
      const isDiscord = hasDiscordParams || isInDiscordFrame || hasDiscordDomain || hasDiscordReferrer;
      
      console.log('🔍 Discord detection results:', {
        hasDiscordParams,
        isInDiscordFrame,
        hasDiscordDomain,
        hasDiscordReferrer,
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
