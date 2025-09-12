-- V2__add_missing_columns.sql
-- Adds missing columns expected by JPA Entities (idempotent check using information_schema)

SET @schema := DATABASE();

-- title
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@schema AND TABLE_NAME='events' AND COLUMN_NAME='title');
SET @sql := IF(@col = 0, 'ALTER TABLE `events` ADD COLUMN `title` VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- description
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@schema AND TABLE_NAME='events' AND COLUMN_NAME='description');
SET @sql := IF(@col = 0, 'ALTER TABLE `events` ADD COLUMN `description` TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- capacity
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@schema AND TABLE_NAME='events' AND COLUMN_NAME='capacity');
SET @sql := IF(@col = 0, 'ALTER TABLE `events` ADD COLUMN `capacity` INT DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- date
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@schema AND TABLE_NAME='events' AND COLUMN_NAME='date');
SET @sql := IF(@col = 0, 'ALTER TABLE `events` ADD COLUMN `date` DATETIME NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- created_by
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@schema AND TABLE_NAME='events' AND COLUMN_NAME='created_by');
SET @sql := IF(@col = 0, 'ALTER TABLE `events` ADD COLUMN `created_by` BIGINT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;