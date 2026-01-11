-- Database initialization script for Apyvyra

-- Enable citext extension for case-insensitive text (most reliable approach)
CREATE EXTENSION IF NOT EXISTS citext;

DROP TABLE IF EXISTS customer_phone_call CASCADE;
DROP TABLE IF EXISTS order_item CASCADE;
DROP TABLE IF EXISTS customer_order CASCADE;
DROP TABLE IF EXISTS customer CASCADE;
DROP TABLE IF EXISTS address CASCADE;
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
    full_name citext,
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
CREATE INDEX idx_app_user_full_name ON app_user(full_name);
CREATE INDEX idx_app_user_user_type ON app_user(user_type);

-- Address table - stores validated addresses with Google Maps metadata
CREATE TABLE address (
    id SERIAL PRIMARY KEY,
    address_line TEXT NOT NULL,
    google_place_id VARCHAR(255),
    formatted_address TEXT,
    country VARCHAR(100),
    country_code VARCHAR(10),
    state VARCHAR(100),
    state_code VARCHAR(10),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    street_number VARCHAR(50),
    route VARCHAR(255),
    is_validated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL REFERENCES app_user(id),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES app_user(id)
);
CREATE INDEX idx_address_google_place_id ON address(google_place_id) WHERE google_place_id IS NOT NULL;
CREATE INDEX idx_address_country ON address(country);
CREATE INDEX idx_address_state ON address(state);
CREATE INDEX idx_address_city ON address(city);
CREATE INDEX idx_address_postal_code ON address(postal_code);

-- Customer table - extends app_user with customer-specific fields
-- All customers have user_type = 2 in app_user
CREATE TABLE customer (
    id SERIAL PRIMARY KEY,
    app_user_id INTEGER NOT NULL UNIQUE REFERENCES app_user(id) ON DELETE CASCADE,
    phone VARCHAR(50),
    notes TEXT,
    address_id INTEGER REFERENCES address(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL REFERENCES app_user(id),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES app_user(id)
);
CREATE INDEX idx_customer_app_user ON customer(app_user_id);
CREATE INDEX idx_customer_phone ON customer(phone);
CREATE INDEX idx_customer_address ON customer(address_id) WHERE address_id IS NOT NULL;

-- Customer Phone Call Events table - tracks phone interactions with customers
CREATE TABLE customer_phone_call (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
    call_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    call_type INTEGER NOT NULL DEFAULT 0 CHECK (call_type IN (0, 1, 2)), -- 0: inbound, 1: outbound, 2: missed
    duration_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL REFERENCES app_user(id),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES app_user(id)
);
CREATE INDEX idx_customer_phone_call_customer ON customer_phone_call(customer_id);
CREATE INDEX idx_customer_phone_call_date ON customer_phone_call(call_date);
CREATE INDEX idx_customer_phone_call_type ON customer_phone_call(call_type);

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
    tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
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

-- Customer Order table
-- Order Status: 0=pending_payment, 1=paid, 2=confirmed, 3=processing, 4=shipped, 5=completed, 6=cancelled, 7=on_hold
-- Payment Status: 0=pending, 1=succeeded, 2=failed, 3=refunded
CREATE TABLE customer_order (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL REFERENCES customer(id),
    status INTEGER NOT NULL DEFAULT 0 CHECK (status IN (0, 1, 2, 3, 4, 5, 6, 7)),
    payment_status INTEGER NOT NULL DEFAULT 0 CHECK (payment_status IN (0, 1, 2, 3)),
    shipping_address_id INTEGER NOT NULL REFERENCES address(id),
    subtotal DECIMAL(19, 4) NOT NULL,
    tax_amount DECIMAL(19, 4) NOT NULL,
    total_amount DECIMAL(19, 4) NOT NULL,
    notes TEXT,
    stripe_payment_intent_id VARCHAR(255),
    stripe_client_secret VARCHAR(255),
    paid_at TIMESTAMPTZ,
    order_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL REFERENCES app_user(id),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES app_user(id)
);
CREATE INDEX idx_customer_order_number ON customer_order(order_number);
CREATE INDEX idx_customer_order_customer ON customer_order(customer_id);
CREATE INDEX idx_customer_order_status ON customer_order(status);
CREATE INDEX idx_customer_order_payment_status ON customer_order(payment_status);
CREATE INDEX idx_customer_order_date ON customer_order(order_date);
CREATE INDEX idx_customer_order_stripe_payment_intent ON customer_order(stripe_payment_intent_id);
CREATE INDEX idx_customer_order_shipping_address ON customer_order(shipping_address_id);

-- Order Item table
CREATE TABLE order_item (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES customer_order(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES product(id),
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(19, 4) NOT NULL,
    tax_rate DECIMAL(5, 2) NOT NULL,
    tax_amount DECIMAL(19, 4) NOT NULL,
    line_total DECIMAL(19, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_order_item_order ON order_item(order_id);
CREATE INDEX idx_order_item_product ON order_item(product_id);
