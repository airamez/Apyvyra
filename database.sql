-- Database initialization script for Apyvyra

DROP TABLE IF EXISTS product_documents;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS product_categories;
DROP TABLE IF EXISTS users;

-- Users table with auditing
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER
);
CREATE INDEX idx_users_email ON users(email);

-- Product Categories table with auditing
CREATE TABLE product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_category_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id),
    FOREIGN KEY (parent_category_id) REFERENCES product_categories(id) ON DELETE SET NULL
);
CREATE INDEX idx_product_categories_name ON product_categories(name);
CREATE INDEX idx_product_categories_parent ON product_categories(parent_category_id);

-- Products table with auditing
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    short_description VARCHAR(1000),
    category_id INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
    price DECIMAL(18, 2) NOT NULL,
    cost_price DECIMAL(18, 2),
    compare_at_price DECIMAL(18, 2),
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    sku_barcode VARCHAR(100),
    brand VARCHAR(255),
    manufacturer VARCHAR(255),
    weight DECIMAL(18, 2),
    weight_unit VARCHAR(20),
    dimensions JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id)
);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_is_active ON products(is_active);

-- Product Documents table with auditing
CREATE TABLE product_documents (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    document_url VARCHAR(1000) NOT NULL,
    document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('image', 'video', 'manual')),
    alt_text VARCHAR(500),
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);
CREATE INDEX idx_product_documents_product ON product_documents(product_id);
CREATE INDEX idx_product_documents_type ON product_documents(document_type);
CREATE INDEX idx_product_documents_primary ON product_documents(is_primary);
