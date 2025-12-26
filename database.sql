-- Database initialization script for Apyvyra

-- Enable citext extension for case-insensitive text (most reliable approach)
CREATE EXTENSION IF NOT EXISTS citext;

DROP TABLE IF EXISTS product_url CASCADE;
DROP TABLE IF EXISTS product_image CASCADE;
DROP TABLE IF EXISTS product CASCADE;
DROP TABLE IF EXISTS product_category CASCADE;
DROP TABLE IF EXISTS app_user CASCADE;

-- App User table with auditing and email confirmation
CREATE TABLE app_user (
    id SERIAL PRIMARY KEY,
    email citext NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    user_type INTEGER NOT NULL DEFAULT 2 CHECK (user_type IN (0, 1, 2)), -- 0: admin, 1: staff, 2: customer
    status INTEGER NOT NULL DEFAULT 0 CHECK (status IN (0, 1, 2)), -- 0: pending_confirmation, 1: active, 2: inactive
    confirmation_token VARCHAR(255),
    confirmation_token_expires_at TIMESTAMPTZ,
    email_confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER
);
CREATE INDEX idx_app_user_email ON app_user(email);

-- Product Category table with auditing
CREATE TABLE product_category (
    id SERIAL PRIMARY KEY,
    name citext NOT NULL,
    description TEXT,
    parent_category_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL REFERENCES app_user(id),
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
    name citext NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES product_category(id) ON DELETE SET NULL,
    price DECIMAL(19, 4) NOT NULL,
    cost_price DECIMAL(19, 4),
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    brand citext,
    manufacturer citext,
    weight VARCHAR(255),
    dimensions VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    url_type INTEGER NOT NULL CHECK (url_type IN (0, 1, 2)), -- 0: image, 1: video, 2: manual
    alt_text VARCHAR(500),
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL REFERENCES app_user(id)
);
CREATE INDEX idx_product_url_product ON product_url(product_id);
CREATE INDEX idx_product_url_type ON product_url(url_type);
CREATE INDEX idx_product_url_primary ON product_url(is_primary);
