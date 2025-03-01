-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Modules Table (Roadmap Structure)
CREATE TABLE modules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  order_position INT UNIQUE NOT NULL CHECK (order_position > 0)
);

-- Questions Table
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  question_text TEXT NOT NULL,
  difficulty VARCHAR(50) NOT NULL,
  company_tag VARCHAR(50),
  module_id INT REFERENCES modules(id) ON DELETE SET NULL,
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Progress Table
CREATE TABLE user_progress (
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  module_id INT REFERENCES modules(id) ON DELETE CASCADE,
  completed_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, module_id)
);

-- Interviews/Attempts Table
CREATE TABLE interviews (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  question_id INT REFERENCES questions(id) ON DELETE SET NULL,
  code_submission TEXT NOT NULL,
  ai_feedback JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE test_cases (
  id SERIAL PRIMARY KEY,
  question_id INT REFERENCES questions(id) ON DELETE CASCADE,
  input TEXT NOT NULL,
  output TEXT NOT NULL
);


-- Indexes for Optimization
CREATE INDEX idx_user_progress ON user_progress(user_id, module_id);
CREATE INDEX idx_modules_order ON modules(order_position);
CREATE INDEX idx_questions_module ON questions(module_id);