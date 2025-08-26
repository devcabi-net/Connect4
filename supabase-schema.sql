-- Connect4 Discord Activity Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable real-time for the tables we'll be using
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  game_type VARCHAR(50) NOT NULL,
  max_players INTEGER NOT NULL DEFAULT 2,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting',
  is_private BOOLEAN NOT NULL DEFAULT false,
  host_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Room players table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS room_players (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(50) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id VARCHAR(50) NOT NULL,
  player_name VARCHAR(255) NOT NULL,
  player_avatar TEXT,
  is_host BOOLEAN NOT NULL DEFAULT false,
  is_ready BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, player_id)
);

-- Game moves table (for game state persistence)
CREATE TABLE IF NOT EXISTS game_moves (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(50) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id VARCHAR(50) NOT NULL,
  move_data JSONB NOT NULL,
  move_sequence INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_last_activity ON rooms(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_room_players_room_id ON room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_game_moves_room_id ON game_moves(room_id);
CREATE INDEX IF NOT EXISTS idx_game_moves_sequence ON game_moves(room_id, move_sequence);

-- Enable Row Level Security (RLS)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_moves ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for now - tighten in production)
CREATE POLICY "Allow all on rooms" ON rooms FOR ALL USING (true);
CREATE POLICY "Allow all on room_players" ON room_players FOR ALL USING (true);
CREATE POLICY "Allow all on game_moves" ON game_moves FOR ALL USING (true);

-- Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE game_moves;

-- Clean up old rooms (function to be called periodically)
CREATE OR REPLACE FUNCTION cleanup_old_rooms()
RETURNS void AS $$
BEGIN
  -- Delete rooms inactive for more than 24 hours
  DELETE FROM rooms 
  WHERE last_activity < NOW() - INTERVAL '24 hours';
  
  -- Log cleanup
  RAISE NOTICE 'Cleaned up old rooms';
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update last_activity when room_players change
CREATE OR REPLACE FUNCTION update_room_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE rooms 
    SET last_activity = NOW() 
    WHERE id = NEW.room_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE rooms 
    SET last_activity = NOW() 
    WHERE id = OLD.room_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_room_activity ON room_players;
CREATE TRIGGER trigger_update_room_activity
  AFTER INSERT OR UPDATE OR DELETE ON room_players
  FOR EACH ROW EXECUTE FUNCTION update_room_activity();

-- Sample data (optional - remove in production)
-- INSERT INTO rooms (id, name, game_type, max_players, host_id) 
-- VALUES ('demo-room-1', 'Test Room', 'connect4', 2, 'demo-user-123');

COMMIT;

