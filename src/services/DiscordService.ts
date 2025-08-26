import { DiscordSDK } from '@discord/embedded-app-sdk';
import { EventEmitter } from '@core/EventEmitter';
import { DiscordUser } from '@core/types';

export interface DiscordConfig {
  clientId: string;
  scopes: ('identify' | 'guilds')[];
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
      if (!this.isRunningInDiscord() && !this.config.forceDiscordMode) {
        console.log('🔧 Running in demo mode - Discord not detected');
        await this.initializeDemoMode();
        return true;
      }

      console.log('🎯 Initializing Discord SDK...');
      
      if (this.config.forceDiscordMode) {
        console.log('🔧 Force Discord mode enabled - will attempt Discord auth even if not detected');
      }
      
      // Initialize Discord SDK
      this.sdk = new DiscordSDK(this.config.clientId);
      
      // Wait for SDK to be ready with timeout
      const readyPromise = this.sdk.ready();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Discord SDK ready timeout')), 10000)
      );
      
      await Promise.race([readyPromise, timeoutPromise]);
      console.log('✅ Discord SDK ready');

      // Authenticate with Discord with timeout
      console.log('🔐 Authenticating with Discord...');
      const authPromise = this.sdk.commands.authenticate({});
      const authTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Discord authentication timeout after 15 seconds')), 15000)
      );
      
      const authResponse = await Promise.race([authPromise, authTimeout]) as any;
      console.log('✅ Authentication successful:', authResponse);

      if (authResponse && authResponse.user) {
        this.currentUser = {
          id: authResponse.user.id,
          username: authResponse.user.username,
          discriminator: authResponse.user.discriminator || '0',
          avatar: authResponse.user.avatar || undefined,
          globalName: authResponse.user.global_name || authResponse.user.username
        };

        console.log('✅ User authenticated:', this.currentUser);
      } else {
        throw new Error('Failed to get user information from Discord');
      }

      // Set up activity
      await this.setupActivity();

      this.isConnected = true;
      this.emit('connected', this.currentUser);
      
      console.log(`✅ Discord authenticated: ${this.currentUser?.username}`);
      return true;

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

    // Create a demo user
    this.currentUser = {
      id: `demo_${Math.random().toString(36).substr(2, 9)}`,
      username: `DemoUser${Math.floor(Math.random() * 1000)}`,
      discriminator: '0000',
      globalName: 'Demo User'
    };

    console.log('🎮 Demo mode initialized');
    this.emit('connected', this.currentUser);
  }

  private isRunningInDiscord(): boolean {
    try {
      console.log('🔍 Starting Discord detection...');
      console.log('Current URL:', window.location.href);
      console.log('User Agent:', navigator.userAgent);
      
      // Check multiple Discord indicators
      const urlParams = new URLSearchParams(window.location.search);
      
      // Primary check: Discord SDK is available
      const hasDiscordSDK = typeof window !== 'undefined' && 'DiscordSDK' in window;
      
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
      
      // Return true if ANY Discord indicator is present
      const isDiscord = hasDiscordSDK || hasDiscordFrameId || hasDiscordInstanceId || 
                       hasDiscordChannelId || hasDiscordGuildId || isInDiscordFrame || 
                       hasClientId || hasDiscordUserAgent || hasDiscordReferrer || 
                       hasDiscordAncestor || hasDiscordActivity;
      
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
        forceMode: this.config.forceDiscordMode,
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
