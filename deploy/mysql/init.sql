SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS happynewyear;
USE happynewyear;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` VARCHAR(64) NOT NULL COMMENT 'WeCom UserId',
    `name` VARCHAR(64) NOT NULL DEFAULT '' COMMENT 'Real Name',
    `department` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'Department IDs',
    `avatar` VARCHAR(512) NOT NULL DEFAULT '' COMMENT 'Avatar URL',
    `chances` INT NOT NULL DEFAULT 0 COMMENT 'Available Draw Chances',
    `total_score` BIGINT NOT NULL DEFAULT 0 COMMENT 'Total Accumulated Score',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Awards Configuration
CREATE TABLE IF NOT EXISTS `awards` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(64) NOT NULL COMMENT 'Prize Name',
    `type` TINYINT NOT NULL COMMENT '1=Grand, 2=Regular, 3=Sunshine',
    `total_count` INT NOT NULL COMMENT 'Initial Inventory',
    `remaining` INT NOT NULL COMMENT 'Current Inventory',
    `probability` INT NOT NULL DEFAULT 0 COMMENT 'Weight (out of 10000)',
    `value` INT NOT NULL DEFAULT 0 COMMENT 'Point value for type=4',
    `image_url` VARCHAR(255) DEFAULT '',
    `version` INT NOT NULL DEFAULT 0 COMMENT 'Optimistic Lock',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Game Records
CREATE TABLE IF NOT EXISTS `game_records` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` VARCHAR(64) NOT NULL,
    `game_id` VARCHAR(64) NOT NULL COMMENT 'Unique Game Session ID',
    `score` INT NOT NULL COMMENT 'Game Score',
    `duration` INT NOT NULL COMMENT 'Play duration (seconds)',
    `nonce` VARCHAR(64) NOT NULL COMMENT 'Anti-Replay Nonce',
    `signature` VARCHAR(128) NOT NULL COMMENT 'Client Signature',
    `client_ip` VARCHAR(45) NOT NULL DEFAULT '',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_game_id` (`game_id`),
    UNIQUE KEY `uk_nonce` (`nonce`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Draw Records (Audit Chain)
CREATE TABLE IF NOT EXISTS `draw_records` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` VARCHAR(64) NOT NULL,
    `award_id` INT UNSIGNED NOT NULL,
    `award_name` VARCHAR(64) NOT NULL,
    `prev_hash` VARCHAR(64) NOT NULL DEFAULT '' COMMENT 'Hash of previous record',
    `data_hash` VARCHAR(64) NOT NULL COMMENT 'Hash of this record data',
    `final_hash` VARCHAR(64) NOT NULL COMMENT 'Combined Chain Hash',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Initial Awards Data (2026 Mystery Edition)
INSERT INTO `awards` (`name`, `type`, `total_count`, `remaining`, `probability`, `value`, `image_url`) VALUES
('一等奖：神秘大奖', 1, 1, 1, 1, 0, ''),
('二等奖：神秘大奖', 1, 1, 1, 5, 0, ''),
('三等奖：神秘大奖', 2, 1, 1, 10, 0, ''),
('休假奖励卡', 2, 4, 4, 600, 0, ''),
('幸运奖：1000 积分', 4, 100, 100, 500, 1000, ''),
('幸运奖：500 积分', 4, 500, 500, 1500, 500, ''),
('幸运奖：100 积分', 4, 1000, 1000, 6000, 100, ''),
('新春快乐：马到成功', 3, 99999, 99999, 1384, 0, '');
