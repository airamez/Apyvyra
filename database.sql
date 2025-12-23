-- Database initialization script for Apyvyra

DROP TABLE IF EXISTS product_url CASCADE;
DROP TABLE IF EXISTS product_image CASCADE;
DROP TABLE IF EXISTS product CASCADE;
DROP TABLE IF EXISTS product_category CASCADE;
DROP TABLE IF EXISTS app_user CASCADE;

-- App User table with auditing
CREATE TABLE app_user (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER
);
CREATE INDEX idx_app_user_email ON app_user(email);

-- Product Category table with auditing
CREATE TABLE product_category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_category_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES app_user(id),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES app_user(id),
    FOREIGN KEY (parent_category_id) REFERENCES product_category(id) ON DELETE SET NULL
);
CREATE INDEX idx_product_category_name ON product_category(name);
CREATE INDEX idx_product_category_parent ON product_category(parent_category_id);

-- Product table with auditing
CREATE TABLE product (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    short_description VARCHAR(1000),
    category_id INTEGER REFERENCES product_category(id) ON DELETE SET NULL,
    price DECIMAL(19, 4) NOT NULL,
    cost_price DECIMAL(19, 4),
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    brand VARCHAR(255),
    manufacturer VARCHAR(255),
    weight VARCHAR(255),
    dimensions VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES app_user(id),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES app_user(id)
);
CREATE INDEX idx_product_sku ON product(sku);
CREATE INDEX idx_product_name ON product(name);
CREATE INDEX idx_product_category ON product(category_id);
CREATE INDEX idx_product_brand ON product(brand);
CREATE INDEX idx_product_is_active ON product(is_active);

-- Product URL table with auditing
CREATE TABLE product_url (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    url VARCHAR(1000) NOT NULL,
    url_type VARCHAR(20) NOT NULL CHECK (url_type IN ('image', 'video', 'manual')),
    alt_text VARCHAR(500),
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES app_user(id)
);
CREATE INDEX idx_product_url_product ON product_url(product_id);
CREATE INDEX idx_product_url_type ON product_url(url_type);
CREATE INDEX idx_product_url_primary ON product_url(is_primary);
