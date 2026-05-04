PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE _mocha_migrations (
number     INTEGER UNIQUE,
up_sql     TEXT NOT NULL,
down_sql   TEXT NOT NULL,
applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(1,replace('\nCREATE TABLE users (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  email TEXT NOT NULL UNIQUE,\n  name TEXT,\n  level INTEGER DEFAULT 1,\n  total_videos_watched INTEGER DEFAULT 0,\n  total_earnings REAL DEFAULT 0.0,\n  current_balance REAL DEFAULT 2.0,\n  daily_videos_watched INTEGER DEFAULT 0,\n  daily_limit INTEGER DEFAULT 15,\n  bonus_videos INTEGER DEFAULT 0,\n  last_video_date DATE,\n  last_spin_date DATE,\n  affiliate_code TEXT UNIQUE,\n  referred_by TEXT,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_users_email ON users(email);\nCREATE INDEX idx_users_affiliate_code ON users(affiliate_code);\n\nCREATE TABLE videos (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  title TEXT NOT NULL,\n  description TEXT,\n  youtube_id TEXT NOT NULL,\n  thumbnail_url TEXT,\n  duration_seconds INTEGER NOT NULL,\n  reward_amount REAL NOT NULL DEFAULT 2.0,\n  category TEXT,\n  is_active BOOLEAN DEFAULT true,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE TABLE video_watches (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id INTEGER NOT NULL,\n  video_id INTEGER NOT NULL,\n  earnings REAL NOT NULL,\n  watch_date DATE NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_video_watches_user_date ON video_watches(user_id, watch_date);\n\nCREATE TABLE withdrawals (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id INTEGER NOT NULL,\n  amount REAL NOT NULL,\n  pix_key TEXT NOT NULL,\n  status TEXT NOT NULL DEFAULT ''pending'',\n  processed_at TIMESTAMP,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);\n\nCREATE TABLE spin_results (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id INTEGER NOT NULL,\n  prize_type TEXT NOT NULL,\n  prize_value REAL,\n  spin_date DATE NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_spin_results_user_date ON spin_results(user_id, spin_date);\n','\n',char(10)),replace('\nDROP INDEX idx_spin_results_user_date;\nDROP TABLE spin_results;\nDROP INDEX idx_withdrawals_user_id;\nDROP TABLE withdrawals;\nDROP INDEX idx_video_watches_user_date;\nDROP TABLE video_watches;\nDROP TABLE videos;\nDROP INDEX idx_users_affiliate_code;\nDROP INDEX idx_users_email;\nDROP TABLE users;\n','\n',char(10)),'2025-10-11 22:25:53');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(2,replace('\n-- Insert sample videos\nINSERT INTO videos (title, description, youtube_id, duration_seconds, reward_amount, category, is_active) VALUES\n(''Como Ganhar Dinheiro Online em 2025'', ''Dicas práticas para aumentar sua renda na internet'', ''dQw4w9WgXcQ'', 30, 2.00, ''Educação Financeira'', true),\n(''Top 5 Apps para Ganhar Dinheiro'', ''Os melhores aplicativos para monetizar seu tempo livre'', ''dQw4w9WgXcQ'', 45, 2.00, ''Tecnologia'', true),\n(''Investimentos para Iniciantes'', ''Aprenda a investir seu dinheiro de forma inteligente'', ''dQw4w9WgXcQ'', 60, 2.00, ''Investimentos'', true),\n(''Marketing Digital Básico'', ''Fundamentos do marketing digital para pequenos negócios'', ''dQw4w9WgXcQ'', 35, 2.00, ''Marketing'', true),\n(''Economia Doméstica: Dicas Práticas'', ''Como organizar suas finanças pessoais'', ''dQw4w9WgXcQ'', 40, 2.00, ''Finanças Pessoais'', true),\n(''Empreendedorismo Digital'', ''Primeiros passos para empreender online'', ''dQw4w9WgXcQ'', 50, 2.00, ''Empreendedorismo'', true),\n(''Freelancing: Como Começar'', ''Guia completo para trabalhar como freelancer'', ''dQw4w9WgXcQ'', 55, 2.00, ''Carreira'', true),\n(''Renda Passiva: O que é e Como Criar'', ''Estratégias para gerar renda passiva'', ''dQw4w9WgXcQ'', 42, 2.00, ''Investimentos'', true),\n(''Vendas Online: Estratégias Eficazes'', ''Técnicas para vender mais na internet'', ''dQw4w9WgXcQ'', 38, 2.00, ''Vendas'', true),\n(''Produtividade: Gestão de Tempo'', ''Como ser mais produtivo no dia a dia'', ''dQw4w9WgXcQ'', 33, 2.00, ''Produtividade'', true),\n(''Criptomoedas para Iniciantes'', ''Introdução ao mundo das criptomoedas'', ''dQw4w9WgXcQ'', 48, 2.00, ''Investimentos'', true),\n(''E-commerce: Como Montar sua Loja'', ''Passo a passo para criar um e-commerce'', ''dQw4w9WgXcQ'', 52, 2.00, ''E-commerce'', true);\n\n-- Update existing users to have some bonus videos and better affiliate codes\nUPDATE users SET bonus_videos = 2 WHERE bonus_videos = 0;\n','\n',char(10)),replace('\n-- Remove sample videos\nDELETE FROM videos WHERE youtube_id = ''dQw4w9WgXcQ'';\n\n-- Reset bonus videos\nUPDATE users SET bonus_videos = 0;\n','\n',char(10)),'2025-10-11 22:25:53');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(3,replace('\nALTER TABLE users ADD COLUMN password_hash TEXT;\nALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT ''google'';\nALTER TABLE users ADD COLUMN session_token TEXT;\nALTER TABLE users ADD COLUMN session_expires_at TIMESTAMP;\n\nCREATE INDEX idx_users_session_token ON users(session_token);\n','\n',char(10)),replace('\nDROP INDEX idx_users_session_token;\nALTER TABLE users DROP COLUMN session_expires_at;\nALTER TABLE users DROP COLUMN session_token;\nALTER TABLE users DROP COLUMN auth_provider;\nALTER TABLE users DROP COLUMN password_hash;\n','\n',char(10)),'2025-10-11 22:25:54');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(4,replace('\nALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;\n\n-- Make the first user an admin (you can change this email to yours)\nUPDATE users SET is_admin = true WHERE email = ''admin@nextfund.app'' OR id = 1;\n','\n',char(10)),replace('\nALTER TABLE users DROP COLUMN is_admin;\n','\n',char(10)),'2025-10-11 22:25:54');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(5,replace('\n-- Add new columns to support different video platforms\nALTER TABLE videos ADD COLUMN video_platform TEXT DEFAULT ''youtube'';\nALTER TABLE videos ADD COLUMN video_url TEXT;\nALTER TABLE videos ADD COLUMN embed_url TEXT;\n\n-- Update existing records to have proper platform\nUPDATE videos SET video_platform = ''youtube'' WHERE youtube_id IS NOT NULL;\nUPDATE videos SET video_url = ''https://www.youtube.com/watch?v='' || youtube_id WHERE youtube_id IS NOT NULL;\nUPDATE videos SET embed_url = ''https://www.youtube.com/embed/'' || youtube_id WHERE youtube_id IS NOT NULL;\n','\n',char(10)),replace('\n-- Remove the new columns\nALTER TABLE videos DROP COLUMN embed_url;\nALTER TABLE videos DROP COLUMN video_url;\nALTER TABLE videos DROP COLUMN video_platform;\n','\n',char(10)),'2025-10-11 22:25:54');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(6,replace('\nCREATE TABLE video_questions (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  video_id INTEGER NOT NULL,\n  question TEXT NOT NULL,\n  correct_answer TEXT NOT NULL,\n  wrong_answer TEXT NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_video_questions_video_id ON video_questions(video_id);\n','\n',char(10)),replace('\nDROP INDEX idx_video_questions_video_id;\nDROP TABLE video_questions;\n','\n',char(10)),'2025-10-11 22:25:54');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(7,replace('\nCREATE TABLE video_question_answers (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id INTEGER NOT NULL,\n  video_id INTEGER NOT NULL,\n  question_id INTEGER NOT NULL,\n  selected_answer TEXT NOT NULL,\n  is_correct BOOLEAN NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_video_question_answers_user_video ON video_question_answers(user_id, video_id);\n','\n',char(10)),replace('\nDROP INDEX idx_video_question_answers_user_video;\nDROP TABLE video_question_answers;\n','\n',char(10)),'2025-10-11 22:25:55');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(8,replace('\nUPDATE users \nSET password_hash = ''$2a$10$vKE8M1J8A3PksXJW.hRYGO7j2hLF7HbhgaOILkjhxaxrM8vEK0aqm''\nWHERE email = ''admin@nextfund.com'';\n','\n',char(10)),replace('\nUPDATE users \nSET password_hash = ''$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi''\nWHERE email = ''admin@nextfund.com'';\n','\n',char(10)),'2025-10-11 22:25:55');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(9,replace('\nCREATE TABLE vip_payment_links (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  vip_level INTEGER NOT NULL UNIQUE,\n  payment_url TEXT NOT NULL,\n  is_active BOOLEAN DEFAULT true,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nINSERT INTO vip_payment_links (vip_level, payment_url, is_active) VALUES \n(1, '''', false),\n(2, '''', false),\n(3, '''', false),\n(4, '''', false),\n(5, '''', false),\n(6, '''', false);\n','\n',char(10)),replace('\nDROP TABLE vip_payment_links;\n','\n',char(10)),'2025-10-11 22:25:55');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(10,replace('\nINSERT OR IGNORE INTO vip_payment_links (vip_level, payment_url, is_active) VALUES\n(1, '''', 0),\n(2, '''', 0),\n(3, '''', 0),\n(4, '''', 0),\n(5, '''', 0),\n(6, '''', 0);\n','\n',char(10)),replace('\nDELETE FROM vip_payment_links WHERE vip_level IN (1, 2, 3, 4, 5, 6);\n','\n',char(10)),'2025-10-11 22:25:55');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(11,replace('\n-- Add column to mark videos as featured on home page\nALTER TABLE videos ADD COLUMN is_home_featured BOOLEAN DEFAULT false;\n\n-- Add column to track video file path for uploaded videos\nALTER TABLE videos ADD COLUMN video_file_path TEXT;\n\n-- Update existing videos to not be YouTube dependent\nUPDATE videos SET video_platform = ''direct'' WHERE video_platform = ''youtube'';\n','\n',char(10)),replace('\n-- Remove the added columns\nALTER TABLE videos DROP COLUMN video_file_path;\nALTER TABLE videos DROP COLUMN is_home_featured;\n\n-- Revert video platform changes\nUPDATE videos SET video_platform = ''youtube'' WHERE video_platform = ''direct'';\n','\n',char(10)),'2025-10-11 22:25:55');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(12,replace('-- Insert a default demo video for the homepage if none exists\nINSERT OR IGNORE INTO videos (\n  id, title, description, youtube_id, video_platform, video_url, embed_url, \n  thumbnail_url, duration_seconds, reward_amount, category, is_active, is_home_featured\n) VALUES (\n  1, \n  ''Vídeo Demonstração - Ganhe R$ 2,00'', \n  ''Assista este vídeo demonstrativo e ganhe R$ 2,00 para começar!'',\n  ''dQw4w9WgXcQ'',\n  ''youtube'',\n  ''https://www.youtube.com/watch?v=dQw4w9WgXcQ'',\n  ''https://www.youtube.com/embed/dQw4w9WgXcQ'',\n  ''https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'',\n  10,\n  2.0,\n  ''demo'',\n  1,\n  1\n);','\n',char(10)),'DELETE FROM videos WHERE id = 1 AND youtube_id = ''dQw4w9WgXcQ'';','2025-10-11 22:25:56');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(13,replace('-- Add some demo YouTube videos if none exist\nINSERT OR IGNORE INTO videos (title, description, youtube_id, video_platform, thumbnail_url, duration_seconds, reward_amount, category, is_active, is_home_featured) \nVALUES \n(''Como Ganhar Dinheiro Online'', ''Aprenda métodos legítimos para ganhar dinheiro na internet'', ''dQw4w9WgXcQ'', ''youtube'', ''https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'', 180, 2.00, ''Educação'', 1, 1),\n(''Dicas de Investimento'', ''Estratégias básicas de investimento para iniciantes'', ''ScMzIvxBSi4'', ''youtube'', ''https://img.youtube.com/vi/ScMzIvxBSi4/maxresdefault.jpg'', 240, 2.50, ''Finanças'', 1, 0),\n(''Marketing Digital'', ''Fundamentos do marketing digital moderno'', ''oHg5SJYRHA0'', ''youtube'', ''https://img.youtube.com/vi/oHg5SJYRHA0/maxresdefault.jpg'', 300, 3.00, ''Marketing'', 1, 0);\n','\n',char(10)),replace('-- Remove demo videos\nDELETE FROM videos WHERE youtube_id IN (''dQw4w9WgXcQ'', ''ScMzIvxBSi4'', ''oHg5SJYRHA0'');\n','\n',char(10)),'2025-10-11 22:25:56');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(14,'UPDATE videos SET video_platform = ''youtube'' WHERE video_url LIKE ''%youtube.com%'' OR video_url LIKE ''%youtu.be%'';','UPDATE videos SET video_platform = ''direct'' WHERE video_url LIKE ''%youtube.com%'' OR video_url LIKE ''%youtu.be%'';','2025-10-11 22:25:56');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(15,replace('\nUPDATE users SET is_admin = true WHERE email = ''kaiobrunocastro@gmail.com'';\n','\n',char(10)),replace('\nUPDATE users SET is_admin = false WHERE email = ''kaiobrunocastro@gmail.com'';\n','\n',char(10)),'2025-10-11 22:25:56');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(16,replace('\n-- Create an admin user for testing\nINSERT OR IGNORE INTO users (email, name, password_hash, auth_provider, affiliate_code, is_admin, current_balance, total_earnings, total_videos_watched, daily_videos_watched, level)\nVALUES (''admin@nextfund.com'', ''Admin User'', ''$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'', ''email'', ''ADMIN123'', true, 100.0, 0.0, 0, 0, 1);\n','\n',char(10)),replace('\nDELETE FROM users WHERE email = ''admin@nextfund.com'';\n','\n',char(10)),'2025-10-11 22:25:56');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(17,replace('\n-- Update admin user with correct password hash for ''admin123''\nUPDATE users SET password_hash = ''$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'' WHERE email = ''admin@nextfund.com'';\n','\n',char(10)),replace('\n-- Revert password hash\nUPDATE users SET password_hash = ''$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'' WHERE email = ''admin@nextfund.com'';\n','\n',char(10)),'2025-10-11 22:25:57');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(18,replace('\n-- Update admin user with the correct bcrypt hash for ''admin123''\nUPDATE users SET password_hash = ''$2b$10$V5R7tcwRTj2AemDyEn5GneInkEOHbGD4XmNgrFA3.NY292qpn7Ol2'' WHERE email = ''admin@nextfund.com'';\n','\n',char(10)),replace('\n-- Revert to previous hash\nUPDATE users SET password_hash = ''$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'' WHERE email = ''admin@nextfund.com'';\n','\n',char(10)),'2025-10-11 22:25:57');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(19,replace('\n-- Add YouTube video to home featured videos\nINSERT INTO videos (title, description, youtube_id, video_platform, video_url, embed_url, thumbnail_url, duration_seconds, reward_amount, category, is_active, is_home_featured)\nVALUES (\n  ''Rick Astley - Never Gonna Give You Up (Remastered 4K 60 FPS)'',\n  ''O clássico da internet que nunca sai de moda! Assista e ganhe dinheiro com este vídeo icônico.'',\n  ''dQw4w9WgXcQ'',\n  ''youtube'',\n  ''https://www.youtube.com/watch?v=dQw4w9WgXcQ'',\n  ''https://www.youtube.com/embed/dQw4w9WgXcQ'',\n  ''https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'',\n  213,\n  2.00,\n  ''Música'',\n  1,\n  1\n);\n','\n',char(10)),replace('\n-- Remove the YouTube video\nDELETE FROM videos WHERE youtube_id = ''dQw4w9WgXcQ'' AND is_home_featured = 1;\n','\n',char(10)),'2025-10-11 22:25:57');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(20,replace('\n-- Create users table\nCREATE TABLE IF NOT EXISTS users (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  email TEXT NOT NULL UNIQUE,\n  name TEXT,\n  password_hash TEXT,\n  auth_provider TEXT DEFAULT ''google'',\n  affiliate_code TEXT UNIQUE,\n  referred_by TEXT,\n  current_balance REAL DEFAULT 0.0,\n  total_earnings REAL DEFAULT 0.0,\n  total_videos_watched INTEGER DEFAULT 0,\n  daily_videos_watched INTEGER DEFAULT 0,\n  bonus_videos INTEGER DEFAULT 0,\n  level INTEGER DEFAULT 1,\n  last_video_date TEXT,\n  last_spin_date TEXT,\n  session_token TEXT,\n  session_expires_at TEXT,\n  is_admin BOOLEAN DEFAULT 0,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Create videos table\nCREATE TABLE IF NOT EXISTS videos (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  title TEXT NOT NULL,\n  description TEXT,\n  youtube_id TEXT,\n  video_platform TEXT DEFAULT ''upload'',\n  video_url TEXT,\n  video_file_path TEXT,\n  embed_url TEXT,\n  thumbnail_url TEXT,\n  duration_seconds INTEGER NOT NULL,\n  reward_amount REAL NOT NULL,\n  category TEXT,\n  is_active BOOLEAN DEFAULT 1,\n  is_home_featured BOOLEAN DEFAULT 0,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Create video_questions table\nCREATE TABLE IF NOT EXISTS video_questions (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  video_id INTEGER NOT NULL,\n  question TEXT NOT NULL,\n  correct_answer TEXT NOT NULL,\n  wrong_answer TEXT NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Create video_question_answers table\nCREATE TABLE IF NOT EXISTS video_question_answers (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id INTEGER NOT NULL,\n  video_id INTEGER NOT NULL,\n  question_id INTEGER NOT NULL,\n  selected_answer TEXT NOT NULL,\n  is_correct BOOLEAN NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Create video_watches table\nCREATE TABLE IF NOT EXISTS video_watches (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id INTEGER NOT NULL,\n  video_id INTEGER NOT NULL,\n  earnings REAL NOT NULL,\n  watch_date TEXT NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Create withdrawals table\nCREATE TABLE IF NOT EXISTS withdrawals (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id INTEGER NOT NULL,\n  amount REAL NOT NULL,\n  pix_key TEXT NOT NULL,\n  status TEXT DEFAULT ''pending'',\n  processed_at TEXT,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Create spin_results table\nCREATE TABLE IF NOT EXISTS spin_results (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id INTEGER NOT NULL,\n  prize_type TEXT NOT NULL,\n  prize_value REAL,\n  spin_date TEXT NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Create vip_payment_links table\nCREATE TABLE IF NOT EXISTS vip_payment_links (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  vip_level INTEGER NOT NULL UNIQUE,\n  payment_url TEXT DEFAULT '''',\n  is_active BOOLEAN DEFAULT 0,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Insert default VIP payment links\nINSERT OR IGNORE INTO vip_payment_links (vip_level, payment_url, is_active) VALUES\n(1, '''', 0),\n(2, '''', 0),\n(3, '''', 0),\n(4, '''', 0),\n(5, '''', 0),\n(6, '''', 0);\n\n-- Create indexes\nCREATE INDEX IF NOT EXISTS idx_users_email ON users(email);\nCREATE INDEX IF NOT EXISTS idx_users_affiliate_code ON users(affiliate_code);\nCREATE INDEX IF NOT EXISTS idx_videos_active ON videos(is_active);\nCREATE INDEX IF NOT EXISTS idx_videos_home_featured ON videos(is_home_featured);\nCREATE INDEX IF NOT EXISTS idx_video_watches_user_date ON video_watches(user_id, watch_date);\nCREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);\n','\n',char(10)),replace('\n-- Drop indexes\nDROP INDEX IF EXISTS idx_withdrawals_status;\nDROP INDEX IF EXISTS idx_video_watches_user_date;\nDROP INDEX IF EXISTS idx_videos_home_featured;\nDROP INDEX IF EXISTS idx_videos_active;\nDROP INDEX IF EXISTS idx_users_affiliate_code;\nDROP INDEX IF EXISTS idx_users_email;\n\n-- Drop tables in reverse order\nDROP TABLE IF EXISTS vip_payment_links;\nDROP TABLE IF EXISTS spin_results;\nDROP TABLE IF EXISTS withdrawals;\nDROP TABLE IF EXISTS video_watches;\nDROP TABLE IF EXISTS video_question_answers;\nDROP TABLE IF EXISTS video_questions;\nDROP TABLE IF EXISTS videos;\nDROP TABLE IF EXISTS users;\n','\n',char(10)),'2025-10-11 22:25:57');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(21,replace('\n-- Inserir um vídeo de exemplo para testar o sistema R2\nINSERT INTO videos (\n    title, \n    description, \n    youtube_id, \n    video_platform, \n    video_url, \n    video_file_path, \n    embed_url, \n    duration_seconds, \n    reward_amount, \n    thumbnail_url, \n    category,\n    is_active, \n    is_home_featured\n) VALUES (\n    ''Vídeo de Teste R2 - Exemplo'',\n    ''Este é um vídeo de exemplo para testar o sistema R2 Cloudflare. Assista e ganhe!'',\n    ''teste-r2-example'',\n    ''upload'',\n    ''/api/videos/teste-r2-example.mp4'',\n    ''videos/teste-r2-example.mp4'',\n    ''/api/videos/teste-r2-example.mp4'',\n    30,\n    2.50,\n    ''https://mocha-cdn.com/0199ad76-c855-7534-9f9a-26502756837e/test-video-thumbnail.jpg'',\n    ''Teste'',\n    1,\n    0\n);\n','\n',char(10)),replace('\nDELETE FROM videos WHERE youtube_id = ''teste-r2-example'';\n','\n',char(10)),'2025-10-11 22:25:57');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(22,replace('\n-- Add test video data for R2 serving\nINSERT INTO videos (\n  title,\n  description,\n  youtube_id,\n  video_platform,\n  video_url,\n  video_file_path,\n  thumbnail_url,\n  duration_seconds,\n  reward_amount,\n  category,\n  is_active\n) VALUES (\n  ''Vídeo de Teste R2 - Exemplo'',\n  ''Este é um vídeo de teste servido diretamente do R2 Cloudflare'',\n  '''',\n  ''upload'',\n  ''/api/videos/teste-r2-example.mp4'',\n  ''videos/teste-r2-example.mp4'',\n  ''https://mocha-cdn.com/0199ad94-a6ee-788a-ab41-5fd85967945c/test-video-thumbnail.jpg'',\n  30,\n  2.50,\n  ''Teste'',\n  1\n) ON CONFLICT(id) DO UPDATE SET\n  video_url = ''/api/videos/teste-r2-example.mp4'',\n  video_file_path = ''videos/teste-r2-example.mp4'';\n','\n',char(10)),replace('\nDELETE FROM videos WHERE title = ''Vídeo de Teste R2 - Exemplo'';\n','\n',char(10)),'2025-10-11 22:25:58');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(23,replace('\n-- Inserir um vídeo de exemplo funcional diretamente no banco com URL de YouTube válida\nINSERT INTO videos (\n  title, \n  description, \n  youtube_id, \n  video_platform,\n  video_url,\n  embed_url,\n  duration_seconds,\n  reward_amount,\n  category,\n  is_active,\n  is_home_featured,\n  thumbnail_url\n) VALUES (\n  ''Vídeo de Exemplo - Como Ganhar Dinheiro Online'',\n  ''Este é um vídeo demonstrativo da plataforma NextFund. Assista e ganhe R$ 2,50!'',\n  ''dQw4w9WgXcQ'',\n  ''upload'',\n  ''/api/videos/exemplo-nextfund-demo.mp4'',\n  ''https://www.youtube.com/embed/dQw4w9WgXcQ'',\n  30,\n  2.50,\n  ''Demonstração'',\n  1,\n  0,\n  ''https://mocha-cdn.com/0199adc4-7b0e-7d55-8fda-f0632ca52e97/video-placeholder-thumb.jpg''\n);\n','\n',char(10)),replace('\n-- Remover o vídeo de exemplo\nDELETE FROM videos WHERE title = ''Vídeo de Exemplo - Como Ganhar Dinheiro Online'';\n','\n',char(10)),'2025-10-11 22:25:58');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(24,replace('\n-- Criar um vídeo de exemplo usando um vídeo do Big Buck Bunny (domínio público)\nINSERT INTO videos (\n  title, \n  description, \n  youtube_id, \n  video_platform,\n  video_url,\n  embed_url,\n  duration_seconds,\n  reward_amount,\n  category,\n  is_active,\n  is_home_featured,\n  thumbnail_url,\n  video_file_path\n) VALUES (\n  ''Big Buck Bunny - Vídeo de Demonstração'',\n  ''Vídeo de exemplo da Blender Foundation. Assista este clássico de animação e ganhe R$ 2,50!'',\n  ''big-buck-bunny-demo'',\n  ''upload'',\n  ''https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'',\n  ''https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'',\n  596,\n  2.50,\n  ''Demonstração'',\n  1,\n  0,\n  ''https://mocha-cdn.com/0199adc4-7b0e-7d55-8fda-f0632ca52e97/video-placeholder-thumb.jpg'',\n  NULL\n);\n\n-- Criar outro vídeo de exemplo\nINSERT INTO videos (\n  title, \n  description, \n  youtube_id, \n  video_platform,\n  video_url,\n  embed_url,\n  duration_seconds,\n  reward_amount,\n  category,\n  is_active,\n  is_home_featured,\n  thumbnail_url,\n  video_file_path\n) VALUES (\n  ''Elephants Dream - Curta de Animação'',\n  ''Primeiro filme de código aberto da Blender Foundation. Um clássico da animação digital!'',\n  ''elephants-dream-demo'',\n  ''upload'',\n  ''https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'',\n  ''https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'',\n  654,\n  2.50,\n  ''Demonstração'',\n  1,\n  0,\n  ''https://mocha-cdn.com/0199adc4-7b0e-7d55-8fda-f0632ca52e97/video-placeholder-thumb.jpg'',\n  NULL\n);\n','\n',char(10)),replace('\n-- Remover os vídeos de exemplo\nDELETE FROM videos WHERE youtube_id IN (''big-buck-bunny-demo'', ''elephants-dream-demo'');\n','\n',char(10)),'2025-10-11 22:25:58');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(25,replace('\nINSERT INTO users (email, name, auth_provider, affiliate_code, current_balance, total_earnings, total_videos_watched, daily_videos_watched, level, is_admin)\nVALUES (''admin@nextfund'', ''Administrador'', ''email'', ''ADMIN001'', 0.0, 0.0, 0, 0, 1, true);\n','\n',char(10)),replace('\nDELETE FROM users WHERE email = ''admin@nextfund'';\n','\n',char(10)),'2025-10-11 22:25:58');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(26,replace('\n-- Remove column related to file uploads from videos table\nALTER TABLE videos DROP COLUMN video_file_path;\n','\n',char(10)),replace('\n-- Add back the video_file_path column\nALTER TABLE videos ADD COLUMN video_file_path TEXT;\n','\n',char(10)),'2025-10-11 22:25:58');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(27,replace('\n-- Delete all video-related data in order to avoid any referential issues\nDELETE FROM video_question_answers;\nDELETE FROM video_watches;\nDELETE FROM video_questions;\nDELETE FROM videos;\n\n-- Reset auto-increment counters to start from 1 again\nDELETE FROM sqlite_sequence WHERE name IN (''videos'', ''video_questions'', ''video_watches'', ''video_question_answers'');\n','\n',char(10)),replace('\n-- This migration cannot be reversed as we''re deleting data\n-- The down migration is intentionally empty as we cannot restore deleted data\n','\n',char(10)),'2025-10-11 22:25:59');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(28,replace('\nCREATE TABLE vip_purchases (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id INTEGER NOT NULL,\n  vip_level INTEGER NOT NULL,\n  purchase_date DATE NOT NULL,\n  amount REAL NOT NULL,\n  payment_status TEXT NOT NULL DEFAULT ''pending'',\n  payment_reference TEXT,\n  expires_at TIMESTAMP,\n  is_active BOOLEAN DEFAULT true,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_vip_purchases_user_id ON vip_purchases(user_id);\nCREATE INDEX idx_vip_purchases_vip_level ON vip_purchases(vip_level);\n','\n',char(10)),replace('\nDROP INDEX idx_vip_purchases_vip_level;\nDROP INDEX idx_vip_purchases_user_id;\nDROP TABLE vip_purchases;\n','\n',char(10)),'2025-10-11 22:25:59');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(29,replace('\n-- Table for webhook configurations\nCREATE TABLE webhook_configs (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  provider TEXT NOT NULL,\n  webhook_url TEXT NOT NULL,\n  secret_key TEXT,\n  is_active BOOLEAN DEFAULT true,\n  vip_level_mapping TEXT, -- JSON mapping amounts to VIP levels\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Table for webhook logs\nCREATE TABLE webhook_logs (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  provider TEXT NOT NULL,\n  event_type TEXT NOT NULL,\n  payment_id TEXT,\n  user_email TEXT,\n  vip_level INTEGER,\n  amount REAL,\n  status TEXT NOT NULL DEFAULT ''processed'', -- processed, failed, ignored\n  raw_data TEXT NOT NULL, -- Full webhook payload\n  error_message TEXT,\n  processed_at TIMESTAMP,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Index for webhook logs\nCREATE INDEX idx_webhook_logs_provider ON webhook_logs(provider);\nCREATE INDEX idx_webhook_logs_payment_id ON webhook_logs(payment_id);\nCREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at);\n\n-- Insert default webhook configs for popular payment providers\nINSERT INTO webhook_configs (provider, webhook_url, is_active, vip_level_mapping) VALUES\n(''mercadopago'', ''/api/webhooks/mercadopago'', true, ''{"150": 1, "300": 2, "600": 3, "1200": 4, "2400": 5, "4800": 6}''),\n(''pagseguro'', ''/api/webhooks/pagseguro'', true, ''{"150": 1, "300": 2, "600": 3, "1200": 4, "2400": 5, "4800": 6}''),\n(''stripe'', ''/api/webhooks/stripe'', false, ''{"150": 1, "300": 2, "600": 3, "1200": 4, "2400": 5, "4800": 6}''),\n(''paypal'', ''/api/webhooks/paypal'', false, ''{"150": 1, "300": 2, "600": 3, "1200": 4, "2400": 5, "4800": 6}'');\n','\n',char(10)),replace('\nDROP INDEX idx_webhook_logs_created_at;\nDROP INDEX idx_webhook_logs_payment_id;\nDROP INDEX idx_webhook_logs_provider;\nDROP TABLE webhook_logs;\nDROP TABLE webhook_configs;\n','\n',char(10)),'2025-10-11 22:25:59');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(30,replace('\nCREATE TABLE pushin_transactions (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id INTEGER NOT NULL,\n  qr_code_id TEXT NOT NULL,\n  amount REAL NOT NULL,\n  vip_level INTEGER,\n  status TEXT NOT NULL DEFAULT ''pending'',\n  expires_at TIMESTAMP,\n  user_email TEXT NOT NULL,\n  user_name TEXT,\n  user_cpf TEXT,\n  user_phone TEXT,\n  description TEXT,\n  end_to_end_id TEXT,\n  payer_name TEXT,\n  payer_document TEXT,\n  processed_at TIMESTAMP,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_pushin_transactions_qr_code_id ON pushin_transactions(qr_code_id);\nCREATE INDEX idx_pushin_transactions_user_id ON pushin_transactions(user_id);\nCREATE INDEX idx_pushin_transactions_status ON pushin_transactions(status);\n','\n',char(10)),replace('\nDROP INDEX idx_pushin_transactions_status;\nDROP INDEX idx_pushin_transactions_user_id;\nDROP INDEX idx_pushin_transactions_qr_code_id;\nDROP TABLE pushin_transactions;\n','\n',char(10)),'2025-10-11 22:25:59');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(31,replace('\n-- Insert default webhook configs for pushinpay\nINSERT INTO webhook_configs (provider, webhook_url, is_active, vip_level_mapping) VALUES\n(''pushinpay'', ''/api/pushinpay/webhook'', 1, ''{"150": 1, "300": 2, "600": 3, "1200": 4, "2400": 5, "4800": 6}'');\n\n-- Insert default VIP level mappings\nINSERT OR IGNORE INTO vip_payment_links (vip_level, payment_url, is_active) VALUES\n(1, '''', 1),\n(2, '''', 1),\n(3, '''', 1),\n(4, '''', 1),\n(5, '''', 1),\n(6, '''', 1);\n','\n',char(10)),replace('\nDELETE FROM webhook_configs WHERE provider = ''pushinpay'';\nDELETE FROM vip_payment_links WHERE vip_level IN (1, 2, 3, 4, 5, 6);\n','\n',char(10)),'2025-10-11 22:26:00');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(32,replace('\nCREATE TABLE notifications (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id INTEGER NOT NULL,\n  title TEXT NOT NULL,\n  message TEXT NOT NULL,\n  type TEXT NOT NULL DEFAULT ''info'', -- ''info'', ''success'', ''warning'', ''error''\n  is_read BOOLEAN DEFAULT false,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_notifications_user_id ON notifications(user_id);\nCREATE INDEX idx_notifications_created_at ON notifications(created_at);\n','\n',char(10)),replace('\nDROP INDEX idx_notifications_created_at;\nDROP INDEX idx_notifications_user_id;\nDROP TABLE notifications;\n','\n',char(10)),'2025-10-11 22:26:00');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(33,replace('\n-- Create webhook config for pushinpay if it doesn''t exist\nINSERT OR IGNORE INTO webhook_configs (provider, webhook_url, is_active, vip_level_mapping, created_at, updated_at)\nVALUES (''pushinpay'', ''/api/pushinpay/webhook'', 1, ''{"0.5": 1, "300": 2, "600": 3, "1200": 4, "2400": 5, "4800": 6}'', datetime(''now''), datetime(''now''));\n','\n',char(10)),replace('\nDELETE FROM webhook_configs WHERE provider = ''pushinpay'';\n','\n',char(10)),'2025-10-11 22:26:00');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(34,replace('\n-- Add rate limiting control for PIX queries\nALTER TABLE pushin_transactions ADD COLUMN last_api_check_at TIMESTAMP;\nALTER TABLE pushin_transactions ADD COLUMN api_check_count INTEGER DEFAULT 0;\n','\n',char(10)),replace('\nALTER TABLE pushin_transactions DROP COLUMN api_check_count;\nALTER TABLE pushin_transactions DROP COLUMN last_api_check_at;\n','\n',char(10)),'2025-10-11 22:26:00');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(35,replace('\nCREATE TABLE intermediate_plans (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  price REAL NOT NULL,\n  daily_limit INTEGER NOT NULL,\n  minimum_withdrawal REAL NOT NULL DEFAULT 20.0,\n  is_active BOOLEAN DEFAULT true,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE TABLE intermediate_purchases (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id INTEGER NOT NULL,\n  plan_id INTEGER NOT NULL,\n  purchase_date DATE NOT NULL,\n  amount REAL NOT NULL,\n  payment_status TEXT NOT NULL DEFAULT ''pending'',\n  payment_reference TEXT,\n  expires_at TIMESTAMP,\n  is_active BOOLEAN DEFAULT true,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nINSERT INTO intermediate_plans (name, price, daily_limit, minimum_withdrawal) \nVALUES (''Intermediário'', 89.90, 12, 20.0);\n','\n',char(10)),replace('\nDROP TABLE intermediate_purchases;\nDROP TABLE intermediate_plans;\n','\n',char(10)),'2025-10-11 22:26:01');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(36,replace('\nALTER TABLE pushin_transactions ADD COLUMN plan_type TEXT;\n','\n',char(10)),replace('\nALTER TABLE pushin_transactions DROP COLUMN plan_type;\n','\n',char(10)),'2025-10-11 22:26:01');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(37,replace('\nUPDATE intermediate_plans SET price = 97.90 WHERE name = ''Intermediário'';\n','\n',char(10)),replace('\nUPDATE intermediate_plans SET price = 89.90 WHERE name = ''Intermediário'';\n','\n',char(10)),'2025-10-11 22:26:01');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(38,replace('\nCREATE TABLE coupons (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  code TEXT NOT NULL UNIQUE,\n  description TEXT,\n  discount_type TEXT NOT NULL, -- ''money'', ''percentage'', ''bonus_videos''\n  discount_value REAL NOT NULL,\n  max_uses INTEGER DEFAULT 1,\n  current_uses INTEGER DEFAULT 0,\n  expires_at TIMESTAMP,\n  is_active BOOLEAN DEFAULT true,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE TABLE coupon_uses (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id INTEGER NOT NULL,\n  coupon_id INTEGER NOT NULL,\n  discount_applied REAL NOT NULL,\n  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_coupons_code ON coupons(code);\nCREATE INDEX idx_coupon_uses_user ON coupon_uses(user_id);\nCREATE INDEX idx_coupon_uses_coupon ON coupon_uses(coupon_id);\n','\n',char(10)),replace('\nDROP INDEX idx_coupon_uses_coupon;\nDROP INDEX idx_coupon_uses_user;\nDROP INDEX idx_coupons_code;\nDROP TABLE coupon_uses;\nDROP TABLE coupons;\n','\n',char(10)),'2025-10-11 22:26:01');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(39,replace('\n-- Insert sample coupons for testing\nINSERT INTO coupons (code, description, discount_type, discount_value, max_uses, current_uses, is_active) VALUES\n(''WELCOME10'', ''Cupom de boas-vindas - Ganhe R$ 10,00'', ''money'', 10.0, 100, 0, 1),\n(''BONUS5'', ''Ganhe 5 vídeos bônus grátis'', ''bonus_videos'', 5, 50, 0, 1),\n(''ELOGLE3RGE'', ''Cupom especial - R$ 0,11'', ''money'', 0.11, 1, 0, 1),\n(''SAVE20'', ''Desconto de 20% (máx R$ 20)'', ''percentage'', 20, 25, 0, 1),\n(''FIRSTWATCH'', ''Primeiro vídeo - R$ 5,00'', ''money'', 5.0, 200, 0, 1);\n','\n',char(10)),replace('\n-- Remove sample coupons\nDELETE FROM coupons WHERE code IN (''WELCOME10'', ''BONUS5'', ''ELOGLE3RGE'', ''SAVE20'', ''FIRSTWATCH'');\n','\n',char(10)),'2025-10-11 22:26:02');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(40,replace('\nCREATE TABLE password_reset_tokens (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id INTEGER NOT NULL,\n  email TEXT NOT NULL,\n  token TEXT NOT NULL UNIQUE,\n  expires_at TIMESTAMP NOT NULL,\n  is_used BOOLEAN DEFAULT false,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);\nCREATE INDEX idx_password_reset_tokens_email ON password_reset_tokens(email);\n','\n',char(10)),replace('\nDROP INDEX idx_password_reset_tokens_email;\nDROP INDEX idx_password_reset_tokens_token;\nDROP TABLE password_reset_tokens;\n','\n',char(10)),'2025-10-11 22:26:02');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(41,replace('\n-- Add custom daily limit field to users table\nALTER TABLE users ADD COLUMN custom_daily_limit INTEGER;\n\n-- Create table for user-specific video assignments\nCREATE TABLE user_custom_videos (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id INTEGER NOT NULL,\n  video_id INTEGER NOT NULL,\n  assigned_by_admin_id INTEGER NOT NULL,\n  is_active BOOLEAN DEFAULT true,\n  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  expires_at TIMESTAMP,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Create index for better performance\nCREATE INDEX idx_user_custom_videos_user_id ON user_custom_videos(user_id);\nCREATE INDEX idx_user_custom_videos_video_id ON user_custom_videos(video_id);\n\n-- Create table for user custom settings\nCREATE TABLE user_custom_settings (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id INTEGER NOT NULL UNIQUE,\n  has_custom_videos BOOLEAN DEFAULT false,\n  custom_video_mode BOOLEAN DEFAULT false, -- when true, user only sees assigned videos\n  notes TEXT,\n  managed_by_admin_id INTEGER,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n','\n',char(10)),replace('\n-- Remove custom settings\nDROP TABLE user_custom_settings;\nDROP INDEX idx_user_custom_videos_video_id;\nDROP INDEX idx_user_custom_videos_user_id;\nDROP TABLE user_custom_videos;\n\n-- Remove custom daily limit field\nALTER TABLE users DROP COLUMN custom_daily_limit;\n','\n',char(10)),'2025-10-11 22:26:02');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(42,replace('\n-- Add field to videos table to target bonus users only\nALTER TABLE videos ADD COLUMN target_bonus_users_only BOOLEAN DEFAULT false;\n\n-- Create index for better performance when filtering by bonus users\nCREATE INDEX idx_videos_bonus_target ON videos(target_bonus_users_only, is_active);\n\n-- Create index on users bonus_videos for better filtering performance\nCREATE INDEX idx_users_bonus_videos ON users(bonus_videos);\n','\n',char(10)),replace('\n-- Remove indexes\nDROP INDEX IF EXISTS idx_users_bonus_videos;\nDROP INDEX IF EXISTS idx_videos_bonus_target;\n\n-- Remove column\nALTER TABLE videos DROP COLUMN target_bonus_users_only;\n','\n',char(10)),'2025-10-11 22:26:02');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(43,replace('\n-- Update daily_limit for users who have VIP purchases but incorrect daily_limit\nUPDATE users SET daily_limit = 15 WHERE id IN (\n  SELECT u.id FROM users u\n  JOIN vip_purchases vp ON u.id = vp.user_id\n  WHERE vp.vip_level = 1 AND vp.is_active = 1 AND vp.payment_status = ''completed''\n  AND u.daily_limit != 15\n);\n\nUPDATE users SET daily_limit = 20 WHERE id IN (\n  SELECT u.id FROM users u\n  JOIN vip_purchases vp ON u.id = vp.user_id\n  WHERE vp.vip_level = 2 AND vp.is_active = 1 AND vp.payment_status = ''completed''\n  AND u.daily_limit != 20\n);\n\nUPDATE users SET daily_limit = 25 WHERE id IN (\n  SELECT u.id FROM users u\n  JOIN vip_purchases vp ON u.id = vp.user_id\n  WHERE vp.vip_level = 3 AND vp.is_active = 1 AND vp.payment_status = ''completed''\n  AND u.daily_limit != 25\n);\n\nUPDATE users SET daily_limit = 30 WHERE id IN (\n  SELECT u.id FROM users u\n  JOIN vip_purchases vp ON u.id = vp.user_id\n  WHERE vp.vip_level = 4 AND vp.is_active = 1 AND vp.payment_status = ''completed''\n  AND u.daily_limit != 30\n);\n\nUPDATE users SET daily_limit = 35 WHERE id IN (\n  SELECT u.id FROM users u\n  JOIN vip_purchases vp ON u.id = vp.user_id\n  WHERE vp.vip_level = 5 AND vp.is_active = 1 AND vp.payment_status = ''completed''\n  AND u.daily_limit != 35\n);\n\nUPDATE users SET daily_limit = 40 WHERE id IN (\n  SELECT u.id FROM users u\n  JOIN vip_purchases vp ON u.id = vp.user_id\n  WHERE vp.vip_level = 6 AND vp.is_active = 1 AND vp.payment_status = ''completed''\n  AND u.daily_limit != 40\n);\n\n-- Update daily_limit for users who have Intermediate purchases but incorrect daily_limit\nUPDATE users SET daily_limit = 12 WHERE id IN (\n  SELECT u.id FROM users u\n  JOIN intermediate_purchases ip ON u.id = ip.user_id\n  WHERE ip.is_active = 1 AND ip.payment_status = ''completed''\n  AND u.daily_limit != 12 AND u.custom_daily_limit IS NULL\n);\n','\n',char(10)),replace('\n-- This migration corrects user daily_limit values, no rollback needed\n-- as it fixes existing data corruption\n','\n',char(10)),'2025-10-11 22:26:03');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(44,replace('\n-- Update default daily_limit for users without custom limits\n-- Ensure initiantes have 10 videos per day\nUPDATE users \nSET daily_limit = 10, updated_at = datetime(''now'')\nWHERE level = 1 \n  AND custom_daily_limit IS NULL\n  AND daily_limit != 10;\n\n-- Update intermediate users to have 12 videos per day\nUPDATE users \nSET daily_limit = 12, updated_at = datetime(''now'')\nWHERE level = 2 \n  AND custom_daily_limit IS NULL\n  AND daily_limit != 12;\n\n-- Update new users default balance\nUPDATE users \nSET current_balance = 2.0\nWHERE current_balance IS NULL OR current_balance = 0;\n','\n',char(10)),replace('\n-- Reverse the changes if needed\nUPDATE users \nSET daily_limit = 15\nWHERE level = 1;\n\nUPDATE users \nSET daily_limit = 15\nWHERE level = 2;\n','\n',char(10)),'2025-10-11 22:26:03');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(45,replace('\n-- Create intermediate_plans table if it doesn''t exist\nCREATE TABLE IF NOT EXISTS intermediate_plans (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  price REAL NOT NULL,\n  daily_limit INTEGER NOT NULL,\n  minimum_withdrawal REAL NOT NULL DEFAULT 20.0,\n  is_active BOOLEAN DEFAULT true,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Insert the Intermediário plan\nINSERT OR REPLACE INTO intermediate_plans (id, name, price, daily_limit, minimum_withdrawal, is_active) \nVALUES (1, ''Intermediário'', 97.90, 12, 20.0, true);\n','\n',char(10)),replace('\n-- Remove the intermediate plan\nDELETE FROM intermediate_plans WHERE id = 1;\n','\n',char(10)),'2025-10-11 22:26:03');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(46,replace('\nALTER TABLE users ADD COLUMN is_fake BOOLEAN DEFAULT false;\n','\n',char(10)),replace('\nALTER TABLE users DROP COLUMN is_fake;\n','\n',char(10)),'2025-10-11 22:26:03');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(47,replace('\nCREATE TABLE balance_transfers (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id INTEGER NOT NULL,\n  user_email TEXT NOT NULL,\n  user_name TEXT,\n  admin_id INTEGER NOT NULL,\n  admin_email TEXT NOT NULL,\n  admin_name TEXT,\n  type TEXT NOT NULL, -- ''add'' or ''subtract''\n  amount REAL NOT NULL,\n  previous_balance REAL NOT NULL,\n  new_balance REAL NOT NULL,\n  reason TEXT NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_balance_transfers_user_id ON balance_transfers(user_id);\nCREATE INDEX idx_balance_transfers_admin_id ON balance_transfers(admin_id);\nCREATE INDEX idx_balance_transfers_created_at ON balance_transfers(created_at);\n','\n',char(10)),replace('\nDROP INDEX idx_balance_transfers_created_at;\nDROP INDEX idx_balance_transfers_admin_id;\nDROP INDEX idx_balance_transfers_user_id;\nDROP TABLE balance_transfers;\n','\n',char(10)),'2025-10-11 22:26:03');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(48,replace('\nCREATE TABLE home_banners (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  title TEXT NOT NULL,\n  image_url TEXT NOT NULL,\n  link_url TEXT,\n  description TEXT,\n  is_active BOOLEAN DEFAULT true,\n  display_order INTEGER DEFAULT 0,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_home_banners_active_order ON home_banners(is_active, display_order);\n','\n',char(10)),replace('\nDROP INDEX idx_home_banners_active_order;\nDROP TABLE home_banners;\n','\n',char(10)),'2025-10-11 22:26:04');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(49,replace('\nCREATE TABLE chat_messages (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id INTEGER,\n  user_email TEXT NOT NULL,\n  user_name TEXT,\n  message TEXT NOT NULL,\n  admin_reply TEXT,\n  admin_id INTEGER,\n  admin_name TEXT,\n  status TEXT NOT NULL DEFAULT ''pending'',\n  is_read BOOLEAN DEFAULT false,\n  replied_at TIMESTAMP,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_chat_messages_user_email ON chat_messages(user_email);\nCREATE INDEX idx_chat_messages_status ON chat_messages(status);\nCREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);\n','\n',char(10)),replace('\nDROP INDEX idx_chat_messages_created_at;\nDROP INDEX idx_chat_messages_status;\nDROP INDEX idx_chat_messages_user_email;\nDROP TABLE chat_messages;\n','\n',char(10)),'2025-10-11 22:26:04');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(50,replace('\nCREATE TABLE admin_announcements (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  title TEXT NOT NULL,\n  content TEXT NOT NULL,\n  is_active BOOLEAN DEFAULT true,\n  target_new_users BOOLEAN DEFAULT true,\n  target_all_users BOOLEAN DEFAULT false,\n  priority INTEGER DEFAULT 1,\n  expires_at TIMESTAMP,\n  created_by_admin_id INTEGER NOT NULL,\n  created_by_admin_name TEXT NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE TABLE user_announcement_views (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id INTEGER NOT NULL,\n  announcement_id INTEGER NOT NULL,\n  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_user_announcement_views_user_id ON user_announcement_views(user_id);\nCREATE INDEX idx_user_announcement_views_announcement_id ON user_announcement_views(announcement_id);\n','\n',char(10)),replace('\nDROP INDEX idx_user_announcement_views_announcement_id;\nDROP INDEX idx_user_announcement_views_user_id;\nDROP TABLE user_announcement_views;\nDROP TABLE admin_announcements;\n','\n',char(10)),'2025-10-11 22:26:04');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(51,replace('\nCREATE TABLE live_activities (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  activity_type TEXT NOT NULL, -- ''withdrawal'', ''vip_purchase'', ''registration'', ''video_watch''\n  user_name TEXT NOT NULL, -- masked username like "Usuario*****"\n  message TEXT NOT NULL, -- Complete message to display\n  amount REAL, -- For monetary activities\n  level_info TEXT, -- For VIP purchases\n  is_active BOOLEAN DEFAULT true,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_live_activities_created_at ON live_activities(created_at);\nCREATE INDEX idx_live_activities_active ON live_activities(is_active);\n','\n',char(10)),replace('\nDROP INDEX idx_live_activities_active;\nDROP INDEX idx_live_activities_created_at;\nDROP TABLE live_activities;\n','\n',char(10)),'2025-10-11 22:26:04');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(52,replace('\nCREATE TABLE vip_groups (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  platform TEXT NOT NULL, -- ''whatsapp'' or ''telegram''\n  invite_link TEXT NOT NULL,\n  description TEXT,\n  vip_level_required INTEGER NOT NULL DEFAULT 1,\n  is_active BOOLEAN DEFAULT true,\n  member_count INTEGER DEFAULT 0,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_vip_groups_platform ON vip_groups(platform);\nCREATE INDEX idx_vip_groups_vip_level ON vip_groups(vip_level_required);\nCREATE INDEX idx_vip_groups_active ON vip_groups(is_active);\n','\n',char(10)),replace('\nDROP INDEX idx_vip_groups_active;\nDROP INDEX idx_vip_groups_vip_level;\nDROP INDEX idx_vip_groups_platform;\nDROP TABLE vip_groups;\n','\n',char(10)),'2025-10-11 22:26:04');
CREATE TABLE users (
id INTEGER PRIMARY KEY AUTOINCREMENT,
email TEXT NOT NULL UNIQUE,
name TEXT,
level INTEGER DEFAULT 1,
total_videos_watched INTEGER DEFAULT 0,
total_earnings REAL DEFAULT 0.0,
current_balance REAL DEFAULT 2.0,
daily_videos_watched INTEGER DEFAULT 0,
daily_limit INTEGER DEFAULT 15,
bonus_videos INTEGER DEFAULT 0,
last_video_date DATE,
last_spin_date DATE,
affiliate_code TEXT UNIQUE,
referred_by TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
, password_hash TEXT, auth_provider TEXT DEFAULT 'google', session_token TEXT, session_expires_at TIMESTAMP, is_admin BOOLEAN DEFAULT false, custom_daily_limit INTEGER, is_fake BOOLEAN DEFAULT false);
INSERT INTO "users" ("id","email","name","level","total_videos_watched","total_earnings","current_balance","daily_videos_watched","daily_limit","bonus_videos","last_video_date","last_spin_date","affiliate_code","referred_by","created_at","updated_at","password_hash","auth_provider","session_token","session_expires_at","is_admin","custom_daily_limit","is_fake") VALUES(1,'admin@nextfund.com','Admin User',1,0,0,100,0,10,0,NULL,NULL,'ADMIN123',NULL,'2025-10-11 22:25:56','2025-10-11 22:26:03','$2b$10$V5R7tcwRTj2AemDyEn5GneInkEOHbGD4XmNgrFA3.NY292qpn7Ol2','email',NULL,NULL,1,NULL,0);
INSERT INTO "users" ("id","email","name","level","total_videos_watched","total_earnings","current_balance","daily_videos_watched","daily_limit","bonus_videos","last_video_date","last_spin_date","affiliate_code","referred_by","created_at","updated_at","password_hash","auth_provider","session_token","session_expires_at","is_admin","custom_daily_limit","is_fake") VALUES(2,'admin@nextfund','Administrador',1,0,0,2,0,10,0,NULL,NULL,'ADMIN001',NULL,'2025-10-11 22:25:58','2025-10-11 22:26:03',NULL,'email',NULL,NULL,1,NULL,0);
INSERT INTO "users" ("id","email","name","level","total_videos_watched","total_earnings","current_balance","daily_videos_watched","daily_limit","bonus_videos","last_video_date","last_spin_date","affiliate_code","referred_by","created_at","updated_at","password_hash","auth_provider","session_token","session_expires_at","is_admin","custom_daily_limit","is_fake") VALUES(3,'garagemmotopartsltda@gmail.com','garam',1,0,0,2,0,10,0,NULL,NULL,'WPBU7V',NULL,'2025-12-11 03:16:49','2025-12-11 03:16:49',NULL,'google',NULL,NULL,0,NULL,0);
CREATE TABLE videos (
id INTEGER PRIMARY KEY AUTOINCREMENT,
title TEXT NOT NULL,
description TEXT,
youtube_id TEXT NOT NULL,
thumbnail_url TEXT,
duration_seconds INTEGER NOT NULL,
reward_amount REAL NOT NULL DEFAULT 2.0,
category TEXT,
is_active BOOLEAN DEFAULT true,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
, video_platform TEXT DEFAULT 'youtube', video_url TEXT, embed_url TEXT, is_home_featured BOOLEAN DEFAULT false, target_bonus_users_only BOOLEAN DEFAULT false);
CREATE TABLE video_watches (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL,
video_id INTEGER NOT NULL,
earnings REAL NOT NULL,
watch_date DATE NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE withdrawals (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL,
amount REAL NOT NULL,
pix_key TEXT NOT NULL,
status TEXT NOT NULL DEFAULT 'pending',
processed_at TIMESTAMP,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE spin_results (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL,
prize_type TEXT NOT NULL,
prize_value REAL,
spin_date DATE NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE video_questions (
id INTEGER PRIMARY KEY AUTOINCREMENT,
video_id INTEGER NOT NULL,
question TEXT NOT NULL,
correct_answer TEXT NOT NULL,
wrong_answer TEXT NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE video_question_answers (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL,
video_id INTEGER NOT NULL,
question_id INTEGER NOT NULL,
selected_answer TEXT NOT NULL,
is_correct BOOLEAN NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE vip_payment_links (
id INTEGER PRIMARY KEY AUTOINCREMENT,
vip_level INTEGER NOT NULL UNIQUE,
payment_url TEXT NOT NULL,
is_active BOOLEAN DEFAULT true,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "vip_payment_links" ("id","vip_level","payment_url","is_active","created_at","updated_at") VALUES(1,1,'',0,'2025-10-11 22:25:55','2025-10-11 22:25:55');
INSERT INTO "vip_payment_links" ("id","vip_level","payment_url","is_active","created_at","updated_at") VALUES(2,2,'',0,'2025-10-11 22:25:55','2025-10-11 22:25:55');
INSERT INTO "vip_payment_links" ("id","vip_level","payment_url","is_active","created_at","updated_at") VALUES(3,3,'',0,'2025-10-11 22:25:55','2025-10-11 22:25:55');
INSERT INTO "vip_payment_links" ("id","vip_level","payment_url","is_active","created_at","updated_at") VALUES(4,4,'',0,'2025-10-11 22:25:55','2025-10-11 22:25:55');
INSERT INTO "vip_payment_links" ("id","vip_level","payment_url","is_active","created_at","updated_at") VALUES(5,5,'',0,'2025-10-11 22:25:55','2025-10-11 22:25:55');
INSERT INTO "vip_payment_links" ("id","vip_level","payment_url","is_active","created_at","updated_at") VALUES(6,6,'',0,'2025-10-11 22:25:55','2025-10-11 22:25:55');
CREATE TABLE vip_purchases (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL,
vip_level INTEGER NOT NULL,
purchase_date DATE NOT NULL,
amount REAL NOT NULL,
payment_status TEXT NOT NULL DEFAULT 'pending',
payment_reference TEXT,
expires_at TIMESTAMP,
is_active BOOLEAN DEFAULT true,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE webhook_configs (
id INTEGER PRIMARY KEY AUTOINCREMENT,
provider TEXT NOT NULL,
webhook_url TEXT NOT NULL,
secret_key TEXT,
is_active BOOLEAN DEFAULT true,
vip_level_mapping TEXT, 
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "webhook_configs" ("id","provider","webhook_url","secret_key","is_active","vip_level_mapping","created_at","updated_at") VALUES(1,'mercadopago','/api/webhooks/mercadopago',NULL,1,'{"150": 1, "300": 2, "600": 3, "1200": 4, "2400": 5, "4800": 6}','2025-10-11 22:25:59','2025-10-11 22:25:59');
INSERT INTO "webhook_configs" ("id","provider","webhook_url","secret_key","is_active","vip_level_mapping","created_at","updated_at") VALUES(2,'pagseguro','/api/webhooks/pagseguro',NULL,1,'{"150": 1, "300": 2, "600": 3, "1200": 4, "2400": 5, "4800": 6}','2025-10-11 22:25:59','2025-10-11 22:25:59');
INSERT INTO "webhook_configs" ("id","provider","webhook_url","secret_key","is_active","vip_level_mapping","created_at","updated_at") VALUES(3,'stripe','/api/webhooks/stripe',NULL,0,'{"150": 1, "300": 2, "600": 3, "1200": 4, "2400": 5, "4800": 6}','2025-10-11 22:25:59','2025-10-11 22:25:59');
INSERT INTO "webhook_configs" ("id","provider","webhook_url","secret_key","is_active","vip_level_mapping","created_at","updated_at") VALUES(4,'paypal','/api/webhooks/paypal',NULL,0,'{"150": 1, "300": 2, "600": 3, "1200": 4, "2400": 5, "4800": 6}','2025-10-11 22:25:59','2025-10-11 22:25:59');
INSERT INTO "webhook_configs" ("id","provider","webhook_url","secret_key","is_active","vip_level_mapping","created_at","updated_at") VALUES(5,'pushinpay','/api/pushinpay/webhook',NULL,1,'{"150": 1, "300": 2, "600": 3, "1200": 4, "2400": 5, "4800": 6}','2025-10-11 22:26:00','2025-10-11 22:26:00');
INSERT INTO "webhook_configs" ("id","provider","webhook_url","secret_key","is_active","vip_level_mapping","created_at","updated_at") VALUES(6,'pushinpay','/api/pushinpay/webhook',NULL,1,'{"0.5": 1, "300": 2, "600": 3, "1200": 4, "2400": 5, "4800": 6}','2025-10-11 22:26:00','2025-10-11 22:26:00');
CREATE TABLE webhook_logs (
id INTEGER PRIMARY KEY AUTOINCREMENT,
provider TEXT NOT NULL,
event_type TEXT NOT NULL,
payment_id TEXT,
user_email TEXT,
vip_level INTEGER,
amount REAL,
status TEXT NOT NULL DEFAULT 'processed', 
raw_data TEXT NOT NULL, 
error_message TEXT,
processed_at TIMESTAMP,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE pushin_transactions (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL,
qr_code_id TEXT NOT NULL,
amount REAL NOT NULL,
vip_level INTEGER,
status TEXT NOT NULL DEFAULT 'pending',
expires_at TIMESTAMP,
user_email TEXT NOT NULL,
user_name TEXT,
user_cpf TEXT,
user_phone TEXT,
description TEXT,
end_to_end_id TEXT,
payer_name TEXT,
payer_document TEXT,
processed_at TIMESTAMP,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
, last_api_check_at TIMESTAMP, api_check_count INTEGER DEFAULT 0, plan_type TEXT);
CREATE TABLE notifications (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL,
title TEXT NOT NULL,
message TEXT NOT NULL,
type TEXT NOT NULL DEFAULT 'info', 
is_read BOOLEAN DEFAULT false,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE intermediate_plans (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
price REAL NOT NULL,
daily_limit INTEGER NOT NULL,
minimum_withdrawal REAL NOT NULL DEFAULT 20.0,
is_active BOOLEAN DEFAULT true,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "intermediate_plans" ("id","name","price","daily_limit","minimum_withdrawal","is_active","created_at","updated_at") VALUES(1,'Intermediário',97.9,12,20,1,'2025-10-11 22:26:03','2025-10-11 22:26:03');
CREATE TABLE intermediate_purchases (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL,
plan_id INTEGER NOT NULL,
purchase_date DATE NOT NULL,
amount REAL NOT NULL,
payment_status TEXT NOT NULL DEFAULT 'pending',
payment_reference TEXT,
expires_at TIMESTAMP,
is_active BOOLEAN DEFAULT true,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE coupons (
id INTEGER PRIMARY KEY AUTOINCREMENT,
code TEXT NOT NULL UNIQUE,
description TEXT,
discount_type TEXT NOT NULL, 
discount_value REAL NOT NULL,
max_uses INTEGER DEFAULT 1,
current_uses INTEGER DEFAULT 0,
expires_at TIMESTAMP,
is_active BOOLEAN DEFAULT true,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "coupons" ("id","code","description","discount_type","discount_value","max_uses","current_uses","expires_at","is_active","created_at","updated_at") VALUES(1,'WELCOME10','Cupom de boas-vindas - Ganhe R$ 10,00','money',10,100,0,NULL,1,'2025-10-11 22:26:02','2025-10-11 22:26:02');
INSERT INTO "coupons" ("id","code","description","discount_type","discount_value","max_uses","current_uses","expires_at","is_active","created_at","updated_at") VALUES(2,'BONUS5','Ganhe 5 vídeos bônus grátis','bonus_videos',5,50,0,NULL,1,'2025-10-11 22:26:02','2025-10-11 22:26:02');
INSERT INTO "coupons" ("id","code","description","discount_type","discount_value","max_uses","current_uses","expires_at","is_active","created_at","updated_at") VALUES(3,'ELOGLE3RGE','Cupom especial - R$ 0,11','money',0.11,1,0,NULL,1,'2025-10-11 22:26:02','2025-10-11 22:26:02');
INSERT INTO "coupons" ("id","code","description","discount_type","discount_value","max_uses","current_uses","expires_at","is_active","created_at","updated_at") VALUES(4,'SAVE20','Desconto de 20% (máx R$ 20)','percentage',20,25,0,NULL,1,'2025-10-11 22:26:02','2025-10-11 22:26:02');
INSERT INTO "coupons" ("id","code","description","discount_type","discount_value","max_uses","current_uses","expires_at","is_active","created_at","updated_at") VALUES(5,'FIRSTWATCH','Primeiro vídeo - R$ 5,00','money',5,200,0,NULL,1,'2025-10-11 22:26:02','2025-10-11 22:26:02');
CREATE TABLE coupon_uses (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL,
coupon_id INTEGER NOT NULL,
discount_applied REAL NOT NULL,
applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE password_reset_tokens (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL,
email TEXT NOT NULL,
token TEXT NOT NULL UNIQUE,
expires_at TIMESTAMP NOT NULL,
is_used BOOLEAN DEFAULT false,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE user_custom_videos (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL,
video_id INTEGER NOT NULL,
assigned_by_admin_id INTEGER NOT NULL,
is_active BOOLEAN DEFAULT true,
assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
expires_at TIMESTAMP,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE user_custom_settings (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL UNIQUE,
has_custom_videos BOOLEAN DEFAULT false,
custom_video_mode BOOLEAN DEFAULT false, 
notes TEXT,
managed_by_admin_id INTEGER,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE balance_transfers (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL,
user_email TEXT NOT NULL,
user_name TEXT,
admin_id INTEGER NOT NULL,
admin_email TEXT NOT NULL,
admin_name TEXT,
type TEXT NOT NULL, 
amount REAL NOT NULL,
previous_balance REAL NOT NULL,
new_balance REAL NOT NULL,
reason TEXT NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE home_banners (
id INTEGER PRIMARY KEY AUTOINCREMENT,
title TEXT NOT NULL,
image_url TEXT NOT NULL,
link_url TEXT,
description TEXT,
is_active BOOLEAN DEFAULT true,
display_order INTEGER DEFAULT 0,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE chat_messages (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER,
user_email TEXT NOT NULL,
user_name TEXT,
message TEXT NOT NULL,
admin_reply TEXT,
admin_id INTEGER,
admin_name TEXT,
status TEXT NOT NULL DEFAULT 'pending',
is_read BOOLEAN DEFAULT false,
replied_at TIMESTAMP,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE admin_announcements (
id INTEGER PRIMARY KEY AUTOINCREMENT,
title TEXT NOT NULL,
content TEXT NOT NULL,
is_active BOOLEAN DEFAULT true,
target_new_users BOOLEAN DEFAULT true,
target_all_users BOOLEAN DEFAULT false,
priority INTEGER DEFAULT 1,
expires_at TIMESTAMP,
created_by_admin_id INTEGER NOT NULL,
created_by_admin_name TEXT NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE user_announcement_views (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL,
announcement_id INTEGER NOT NULL,
viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE live_activities (
id INTEGER PRIMARY KEY AUTOINCREMENT,
activity_type TEXT NOT NULL, 
user_name TEXT NOT NULL, 
message TEXT NOT NULL, 
amount REAL, 
level_info TEXT, 
is_active BOOLEAN DEFAULT true,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE vip_groups (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
platform TEXT NOT NULL, 
invite_link TEXT NOT NULL,
description TEXT,
vip_level_required INTEGER NOT NULL DEFAULT 1,
is_active BOOLEAN DEFAULT true,
member_count INTEGER DEFAULT 0,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('vip_payment_links',24);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('users',3);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('webhook_configs',6);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('intermediate_plans',1);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('coupons',5);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_affiliate_code ON users(affiliate_code);
CREATE INDEX idx_video_watches_user_date ON video_watches(user_id, watch_date);
CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_spin_results_user_date ON spin_results(user_id, spin_date);
CREATE INDEX idx_users_session_token ON users(session_token);
CREATE INDEX idx_video_questions_video_id ON video_questions(video_id);
CREATE INDEX idx_video_question_answers_user_video ON video_question_answers(user_id, video_id);
CREATE INDEX idx_videos_active ON videos(is_active);
CREATE INDEX idx_videos_home_featured ON videos(is_home_featured);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_vip_purchases_user_id ON vip_purchases(user_id);
CREATE INDEX idx_vip_purchases_vip_level ON vip_purchases(vip_level);
CREATE INDEX idx_webhook_logs_provider ON webhook_logs(provider);
CREATE INDEX idx_webhook_logs_payment_id ON webhook_logs(payment_id);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at);
CREATE INDEX idx_pushin_transactions_qr_code_id ON pushin_transactions(qr_code_id);
CREATE INDEX idx_pushin_transactions_user_id ON pushin_transactions(user_id);
CREATE INDEX idx_pushin_transactions_status ON pushin_transactions(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupon_uses_user ON coupon_uses(user_id);
CREATE INDEX idx_coupon_uses_coupon ON coupon_uses(coupon_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX idx_user_custom_videos_user_id ON user_custom_videos(user_id);
CREATE INDEX idx_user_custom_videos_video_id ON user_custom_videos(video_id);
CREATE INDEX idx_videos_bonus_target ON videos(target_bonus_users_only, is_active);
CREATE INDEX idx_users_bonus_videos ON users(bonus_videos);
CREATE INDEX idx_balance_transfers_user_id ON balance_transfers(user_id);
CREATE INDEX idx_balance_transfers_admin_id ON balance_transfers(admin_id);
CREATE INDEX idx_balance_transfers_created_at ON balance_transfers(created_at);
CREATE INDEX idx_home_banners_active_order ON home_banners(is_active, display_order);
CREATE INDEX idx_chat_messages_user_email ON chat_messages(user_email);
CREATE INDEX idx_chat_messages_status ON chat_messages(status);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_user_announcement_views_user_id ON user_announcement_views(user_id);
CREATE INDEX idx_user_announcement_views_announcement_id ON user_announcement_views(announcement_id);
CREATE INDEX idx_live_activities_created_at ON live_activities(created_at);
CREATE INDEX idx_live_activities_active ON live_activities(is_active);
CREATE INDEX idx_vip_groups_platform ON vip_groups(platform);
CREATE INDEX idx_vip_groups_vip_level ON vip_groups(vip_level_required);
CREATE INDEX idx_vip_groups_active ON vip_groups(is_active);
