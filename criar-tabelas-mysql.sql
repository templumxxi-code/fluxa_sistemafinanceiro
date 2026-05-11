-- ============================================
-- Script de criação de tabelas para MySQL
-- Hostinger Cloud Hosting
-- ============================================

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Criar tabela de centros de custo
CREATE TABLE IF NOT EXISTS financial_centers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_center (user_id, name)
);

-- Criar tabela principal de dados financeiros
CREATE TABLE IF NOT EXISTS financial_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('investimento', 'receita', 'despesa') NOT NULL,
    category VARCHAR(100),
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    rendimento DECIMAL(10, 2) DEFAULT 0,
    date DATE NOT NULL,
    description TEXT,
    centro_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (centro_id) REFERENCES financial_centers(id) ON DELETE SET NULL,
    INDEX idx_user_type (user_id, type),
    INDEX idx_date (date),
    INDEX idx_user_date (user_id, date)
);

-- Criar índices para melhor performance
CREATE INDEX idx_financial_data_user ON financial_data(user_id);
CREATE INDEX idx_financial_data_type ON financial_data(type);
CREATE INDEX idx_financial_data_category ON financial_data(category);
CREATE INDEX idx_financial_centers_user ON financial_centers(user_id);

-- ============================================
-- Dados de exemplo (opcional)
-- ============================================

-- Inserir usuário de teste
INSERT INTO users (email, password, name) VALUES 
('test@example.com', '$2a$10$example', 'Usuário Teste') 
ON DUPLICATE KEY UPDATE name='Usuário Teste';

-- ============================================
-- Verificação
-- ============================================
-- SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE();
