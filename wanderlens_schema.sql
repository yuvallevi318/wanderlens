-- WanderLens MySQL Schema
-- Run this once on your RDS instance

CREATE DATABASE IF NOT EXISTS wanderlens;
USE wanderlens;

CREATE TABLE IF NOT EXISTS journey (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_name   VARCHAR(100) NOT NULL,
  city        VARCHAR(150) NOT NULL,
  country     VARCHAR(100) NOT NULL,
  lat         DECIMAL(9,6),
  lng         DECIMAL(10,6),
  fun_fact    TEXT,
  user_date   DATE,
  thumbnail   MEDIUMTEXT,
  is_public   TINYINT(1) DEFAULT 0,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sort_order  INT DEFAULT 0,
  INDEX idx_user (user_name),
  INDEX idx_public (is_public)
);
