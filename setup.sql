-- Run once in a NEW Supabase project's SQL Editor. No existing data is deleted.
BEGIN;
CREATE SCHEMA IF NOT EXISTS teachsmart;
REVOKE ALL ON SCHEMA teachsmart FROM PUBLIC;
CREATE TABLE IF NOT EXISTS teachsmart.teacher_access (email text PRIMARY KEY CHECK(email=lower(trim(email))));
CREATE TABLE IF NOT EXISTS teachsmart.sessions (id text PRIMARY KEY,owner text NOT NULL,title text NOT NULL,code text UNIQUE NOT NULL,present text UNIQUE NOT NULL,active text,created bigint NOT NULL);
CREATE TABLE IF NOT EXISTS teachsmart.polls (id text PRIMARY KEY,session text NOT NULL REFERENCES teachsmart.sessions(id) ON DELETE CASCADE,type text NOT NULL CHECK(type IN ('qa','multiple','cloud','text','ideas','ranking','rating','pin')),question text NOT NULL,config text NOT NULL,open integer NOT NULL DEFAULT 0,created bigint NOT NULL);
CREATE TABLE IF NOT EXISTS teachsmart.participants (id text PRIMARY KEY,session text NOT NULL REFERENCES teachsmart.sessions(id) ON DELETE CASCADE,name text NOT NULL,token text UNIQUE NOT NULL,created bigint NOT NULL);
CREATE TABLE IF NOT EXISTS teachsmart.responses (id text PRIMARY KEY,poll text NOT NULL REFERENCES teachsmart.polls(id) ON DELETE CASCADE,participant text NOT NULL REFERENCES teachsmart.participants(id) ON DELETE CASCADE,value text NOT NULL,hidden integer NOT NULL DEFAULT 0,answered integer NOT NULL DEFAULT 0,created bigint NOT NULL,slot integer NOT NULL DEFAULT 0 CHECK(slot BETWEEN 0 AND 9),UNIQUE(poll,participant,slot));
CREATE TABLE IF NOT EXISTS teachsmart.votes (id text PRIMARY KEY,response text NOT NULL REFERENCES teachsmart.responses(id) ON DELETE CASCADE,participant text NOT NULL REFERENCES teachsmart.participants(id) ON DELETE CASCADE,UNIQUE(response,participant));
CREATE INDEX IF NOT EXISTS sessions_owner_idx ON teachsmart.sessions(owner,created);
CREATE INDEX IF NOT EXISTS polls_session_idx ON teachsmart.polls(session,created);
CREATE INDEX IF NOT EXISTS participants_session_idx ON teachsmart.participants(session);
CREATE INDEX IF NOT EXISTS responses_poll_idx ON teachsmart.responses(poll,created);
ALTER TABLE teachsmart.teacher_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachsmart.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachsmart.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachsmart.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachsmart.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachsmart.votes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA teachsmart FROM PUBLIC;
-- The server connects as the project's database owner. No public API policies are created.
COMMIT;
