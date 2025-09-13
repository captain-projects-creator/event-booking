-- schema_postgres.sql (Postgres-compatible)

-- create database if you run as a superuser; on managed DBs you usually create the DB from UI
-- CREATE DATABASE event_booking;

-- Table users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'USER'
);

-- Table events
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    capacity INT NOT NULL
);

-- Table bookings
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    event_id INTEGER,
    qr_code_path VARCHAR(255),
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_bookings_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- prevent duplicate bookings by same user for same event (DB-level safeguard)
CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_user_event ON bookings (user_id, event_id);
