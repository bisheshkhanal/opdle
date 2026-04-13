-- Manual migration for the social/challenge schema.
-- This repository does not currently generate migrations automatically.

CREATE TYPE faction_slug AS ENUM ('marines', 'pirates', 'revolutionary', 'warlords', 'cipher_pol');
CREATE TYPE challenge_status AS ENUM ('draft', 'active', 'expired');

CREATE TABLE IF NOT EXISTS faction_memberships (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  faction_slug faction_slug NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  snapshot_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS faction_memberships_user_unique
  ON faction_memberships (user_id);
CREATE INDEX IF NOT EXISTS faction_memberships_faction_slug_idx
  ON faction_memberships (faction_slug);
CREATE INDEX IF NOT EXISTS faction_memberships_joined_at_idx
  ON faction_memberships (joined_at);

CREATE TABLE IF NOT EXISTS challenge_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  slug text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  tier_level integer NOT NULL,
  status challenge_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS challenge_entities_slug_unique
  ON challenge_entities (slug);
CREATE INDEX IF NOT EXISTS challenge_entities_creator_user_id_idx
  ON challenge_entities (creator_user_id);
CREATE INDEX IF NOT EXISTS challenge_entities_status_idx
  ON challenge_entities (status);
CREATE INDEX IF NOT EXISTS challenge_entities_expires_at_idx
  ON challenge_entities (expires_at);

CREATE TABLE IF NOT EXISTS challenge_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenge_entities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guess_count integer NOT NULL,
  solved_at timestamptz,
  guesses_serialized text NOT NULL,
  faction_snapshot_at_submit varchar(128) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS challenge_attempts_challenge_user_unique
  ON challenge_attempts (challenge_id, user_id);
CREATE INDEX IF NOT EXISTS challenge_attempts_challenge_id_idx
  ON challenge_attempts (challenge_id);
CREATE INDEX IF NOT EXISTS challenge_attempts_user_id_idx
  ON challenge_attempts (user_id);

CREATE TABLE IF NOT EXISTS challenge_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  status challenge_status NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS challenge_packs_slug_unique
  ON challenge_packs (slug);
CREATE INDEX IF NOT EXISTS challenge_packs_status_idx
  ON challenge_packs (status);
CREATE INDEX IF NOT EXISTS challenge_packs_created_at_idx
  ON challenge_packs (created_at);

CREATE TABLE IF NOT EXISTS challenge_pack_entries (
  pack_id uuid NOT NULL REFERENCES challenge_packs(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES challenge_entities(id) ON DELETE CASCADE,
  order_index integer NOT NULL,
  PRIMARY KEY (pack_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS challenge_pack_entries_pack_id_idx
  ON challenge_pack_entries (pack_id);
CREATE INDEX IF NOT EXISTS challenge_pack_entries_challenge_id_idx
  ON challenge_pack_entries (challenge_id);
CREATE INDEX IF NOT EXISTS challenge_pack_entries_pack_order_idx
  ON challenge_pack_entries (pack_id, order_index);

CREATE TABLE IF NOT EXISTS weekly_faction_aggregates (
  week_key varchar(8) NOT NULL,
  faction_slug faction_slug NOT NULL,
  total_points integer NOT NULL,
  avg_guesses real NOT NULL,
  participant_count integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (week_key, faction_slug),
  CONSTRAINT weekly_faction_aggregates_week_key_check CHECK (week_key ~ '^[0-9]{4}-W[0-9]{2}$')
);

CREATE INDEX IF NOT EXISTS weekly_faction_aggregates_faction_slug_idx
  ON weekly_faction_aggregates (faction_slug);
CREATE INDEX IF NOT EXISTS weekly_faction_aggregates_updated_at_idx
  ON weekly_faction_aggregates (updated_at);
