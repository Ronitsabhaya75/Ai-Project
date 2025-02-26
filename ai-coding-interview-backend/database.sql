CREATE DATABASE ai_coding_interview;

\c ai_coding_interview

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  question_text TEXT NOT NULL,
  difficulty VARCHAR(50),
  company_tag VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);