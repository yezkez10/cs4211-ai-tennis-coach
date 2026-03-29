CREATE SCHEMA IF NOT EXISTS tennis_data;

CREATE TABLE IF NOT EXISTS tennis_data.shots (
    player1_name        TEXT,
    player2_name        TEXT,
    player1_hand        TEXT,
    player2_hand        TEXT,
    player1_points      INTEGER,
    player2_points      INTEGER,
    player1_games       INTEGER,
    player2_games       INTEGER,
    player1_sets        INTEGER,
    player2_sets        INTEGER,
    match_date          TEXT,
    tournament          TEXT,
    shot_type           SMALLINT,
    from_court          SMALLINT,
    shot_code           SMALLINT,
    direction           SMALLINT,
    to_court            SMALLINT,
    depth               SMALLINT,
    touched_net         SMALLINT,
    hit_depth           SMALLINT,
    approach_shot       SMALLINT,
    shot_outcome        SMALLINT,
    fault_type          SMALLINT,
    prev_shot_type      SMALLINT,
    prev_from_court     SMALLINT,
    prev_shot_code      SMALLINT,
    prev_direction      SMALLINT,
    prev_to_court       SMALLINT,
    prev_depth          SMALLINT,
    prev_touched_net    SMALLINT,
    prev_hit_depth      SMALLINT,
    prev_approach       SMALLINT,
    prev_outcome        SMALLINT,
    prev_fault_type     SMALLINT,
    pp_shot_type        SMALLINT,
    pp_from_court       SMALLINT,
    pp_shot_code        SMALLINT,
    pp_direction        SMALLINT,
    pp_to_court         SMALLINT,
    pp_depth            SMALLINT,
    pp_touched_net      SMALLINT,
    pp_hit_depth        SMALLINT,
    pp_approach         SMALLINT,
    pp_outcome          SMALLINT,
    pp_fault_type       SMALLINT,
    url                 TEXT,
    description         TEXT
);

CREATE INDEX IF NOT EXISTS idx_shots_player1 ON tennis_data.shots(player1_name);
CREATE INDEX IF NOT EXISTS idx_shots_player2 ON tennis_data.shots(player2_name);
CREATE INDEX IF NOT EXISTS idx_shots_type    ON tennis_data.shots(shot_type);
CREATE INDEX IF NOT EXISTS idx_shots_outcome ON tennis_data.shots(shot_outcome);

COPY tennis_data.shots
FROM '/docker-entrypoint-initdb.d/tennis.csv'
WITH (FORMAT CSV, HEADER FALSE, NULL '');

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_shots_player1_trgm 
ON tennis_data.shots USING gin(player1_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_shots_player2_trgm 
ON tennis_data.shots USING gin(player2_name gin_trgm_ops);
