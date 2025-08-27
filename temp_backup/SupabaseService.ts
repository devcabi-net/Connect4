import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { EventEmitter } from '@core/EventEmitter';
import { GameRoom, Player } from '@core/types';

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export class SupabaseService extends EventEmitter {
  private client: SupabaseClient;
  private roomsChannel: RealtimeChannel | null = null;
  private playersChannel: RealtimeChannel | null = null;
  private connected: boolean = false;

  constructor(config?: SupabaseConfig) {
    super();
    
    // Check if running in Discord Activity (which has CSP restrictions)
    const isDiscordActivity = window.location.hostname.includes('discordsays.com') ||
                              window.location.search.includes('frame_id');
    
    if (isDiscordActivity) {
      console.warn('🔧 Running in Discord Activity - Supabase disabled due to CSP restrictions');
      this.client = null as any;
      return;
    }
    
    // Use environment variables or fallback to demo/local config
    const supabaseUrl = config?.url || import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = config?.anonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('🔧 No Supabase config found, using local-only mode');
      this.client = null as any;
      return;
    }

    this.client = createClient(supabaseUrl, supabaseAnonKey);
    console.log('🔗 Supabase client initialized');
  }

  async initialize(): Promise<boolean> {
    if (!this.client) {
      console.log('🔧 Running in local-only mode');
      return false;
    }

    try {
      // Test connection
      const { error } = await this.client.from('rooms').select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error('❌ Supabase connection failed:', error);
        return false;
      }

      // Set up real-time subscriptions
      await this.setupRealTimeSubscriptions();
      
      this.connected = true;
      console.log('✅ Connected to Supabase');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize Supabase:', error);
      return false;
    }
  }

  private async setupRealTimeSubscriptions(): Promise<void> {
    if (!this.client) return;

    // Subscribe to room changes
    this.roomsChannel = this.client
      .channel('rooms')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'rooms' }, 
          (payload) => {
            console.log('🏠 Room change:', payload);
            this.emit('roomUpdate', payload);
          }
      )
      .subscribe();

    // Subscribe to player changes
    this.playersChannel = this.client
      .channel('players')
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'room_players' },
          (payload) => {
            console.log('👤 Player change:', payload);
            this.emit('playerUpdate', payload);
          }
      )
      .subscribe();

    console.log('📡 Real-time subscriptions active');
  }

  // Room Management
  async createRoom(room: GameRoom): Promise<boolean> {
    if (!this.client) return false;

    try {
      const { error } = await this.client
        .from('rooms')
        .insert([{
          id: room.id,
          name: room.name,
          game_type: room.gameType,
          max_players: room.maxPlayers,
          status: room.status,
          is_private: room.isPrivate,
          created_at: room.created.toISOString(),
          last_activity: room.lastActivity.toISOString(),
          host_id: room.players.find(p => p.isHost)?.id
        }]);

      if (error) {
        console.error('❌ Failed to create room:', error);
        return false;
      }

      // Add initial players
      await this.addPlayersToRoom(room.id, room.players);

      console.log('✅ Room created:', room.id);
      return true;
      
    } catch (error) {
      console.error('❌ Error creating room:', error);
      return false;
    }
  }

  async joinRoom(roomId: string, player: Player): Promise<boolean> {
    if (!this.client) return false;

    try {
      const { error } = await this.client
        .from('room_players')
        .insert([{
          room_id: roomId,
          player_id: player.id,
          player_name: player.name,
          player_avatar: player.avatar,
          is_host: player.isHost || false,
          is_ready: player.isReady || false,
          joined_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('❌ Failed to join room:', error);
        return false;
      }

      // Update room's last activity
      await this.client
        .from('rooms')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', roomId);

      console.log('✅ Player joined room:', roomId);
      return true;
      
    } catch (error) {
      console.error('❌ Error joining room:', error);
      return false;
    }
  }

  async leaveRoom(roomId: string, playerId: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      const { error } = await this.client
        .from('room_players')
        .delete()
        .eq('room_id', roomId)
        .eq('player_id', playerId);

      if (error) {
        console.error('❌ Failed to leave room:', error);
        return false;
      }

      // Check if room is empty and delete if so
      const { data: playersLeft } = await this.client
        .from('room_players')
        .select('player_id')
        .eq('room_id', roomId);

      if (!playersLeft || playersLeft.length === 0) {
        await this.client
          .from('rooms')
          .delete()
          .eq('id', roomId);
        console.log('🗑️ Deleted empty room:', roomId);
      }

      console.log('✅ Player left room:', roomId);
      return true;
      
    } catch (error) {
      console.error('❌ Error leaving room:', error);
      return false;
    }
  }

  async getPublicRooms(): Promise<GameRoom[]> {
    if (!this.client) return [];

    try {
      const { data: rooms, error } = await this.client
        .from('rooms')
        .select(`
          *,
          room_players (
            player_id,
            player_name,
            player_avatar,
            is_host,
            is_ready
          )
        `)
        .eq('is_private', false)
        .eq('status', 'waiting')
        .order('last_activity', { ascending: false });

      if (error) {
        console.error('❌ Failed to get rooms:', error);
        return [];
      }

      return rooms.map(room => ({
        id: room.id,
        name: room.name,
        gameType: room.game_type,
        players: room.room_players.map((p: any) => ({
          id: p.player_id,
          name: p.player_name,
          avatar: p.player_avatar,
          isHost: p.is_host,
          isReady: p.is_ready
        })),
        maxPlayers: room.max_players,
        status: room.status,
        isPrivate: room.is_private,
        created: new Date(room.created_at),
        lastActivity: new Date(room.last_activity)
      }));
      
    } catch (error) {
      console.error('❌ Error getting rooms:', error);
      return [];
    }
  }

  async getRoom(roomId: string): Promise<GameRoom | null> {
    if (!this.client) return null;

    try {
      const { data: room, error } = await this.client
        .from('rooms')
        .select(`
          *,
          room_players (
            player_id,
            player_name,
            player_avatar,
            is_host,
            is_ready
          )
        `)
        .eq('id', roomId)
        .single();

      if (error || !room) {
        console.error('❌ Room not found:', roomId, error);
        return null;
      }

      return {
        id: room.id,
        name: room.name,
        gameType: room.game_type,
        players: room.room_players.map((p: any) => ({
          id: p.player_id,
          name: p.player_name,
          avatar: p.player_avatar,
          isHost: p.is_host,
          isReady: p.is_ready
        })),
        maxPlayers: room.max_players,
        status: room.status,
        isPrivate: room.is_private,
        created: new Date(room.created_at),
        lastActivity: new Date(room.last_activity)
      };
      
    } catch (error) {
      console.error('❌ Error getting room:', error);
      return null;
    }
  }

  async updatePlayerReady(roomId: string, playerId: string, isReady: boolean): Promise<boolean> {
    if (!this.client) return false;

    try {
      const { error } = await this.client
        .from('room_players')
        .update({ is_ready: isReady })
        .eq('room_id', roomId)
        .eq('player_id', playerId);

      if (error) {
        console.error('❌ Failed to update ready status:', error);
        return false;
      }

      console.log('✅ Player ready status updated:', playerId, isReady);
      return true;
      
    } catch (error) {
      console.error('❌ Error updating ready status:', error);
      return false;
    }
  }

  private async addPlayersToRoom(roomId: string, players: Player[]): Promise<void> {
    if (!this.client || !players.length) return;

    const playerRecords = players.map(player => ({
      room_id: roomId,
      player_id: player.id,
      player_name: player.name,
      player_avatar: player.avatar,
      is_host: player.isHost || false,
      is_ready: player.isReady || false,
      joined_at: new Date().toISOString()
    }));

    const { error } = await this.client
      .from('room_players')
      .insert(playerRecords);

    if (error) {
      console.error('❌ Failed to add players to room:', error);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async disconnect(): Promise<void> {
    if (this.roomsChannel) {
      await this.client?.removeChannel(this.roomsChannel);
    }
    if (this.playersChannel) {
      await this.client?.removeChannel(this.playersChannel);
    }
    
    this.connected = false;
    console.log('🔌 Disconnected from Supabase');
  }
}

