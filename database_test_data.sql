-- Test Data for Apyvyra
-- This script creates sample categories and products for testing purposes
-- All product images use public domain images from Unsplash

-- Enable citext extension if not already enabled
CREATE EXTENSION IF NOT EXISTS citext;


DO $$
DECLARE
    admin_user_id INTEGER;
BEGIN
    -- Check if admin user exists
    SELECT id INTO admin_user_id FROM app_user WHERE user_type = 0 LIMIT 1;
    

    -- Insert Product Categories
    INSERT INTO product_category (name, description, is_active, created_by, updated_by) VALUES
    ('Electronics', 'Electronic devices and accessories', true, admin_user_id, admin_user_id),
    ('Home & Kitchen', 'Home appliances and kitchen essentials', true, admin_user_id, admin_user_id),
    ('Sports & Outdoors', 'Sports equipment and outdoor gear', true, admin_user_id, admin_user_id),
    ('Books & Media', 'Books, magazines, and media content', true, admin_user_id, admin_user_id),
    ('Clothing & Accessories', 'Apparel and fashion accessories', true, admin_user_id, admin_user_id);

    -- Electronics Products (20 products)
    INSERT INTO product (sku, name, description, category_id, price, cost_price, tax_rate, stock_quantity, low_stock_threshold, brand, manufacturer, weight, dimensions, is_active, created_by, updated_by)
    SELECT 
        'ELEC-' || LPAD(generate_series::text, 4, '0'),
        name,
        description,
        (SELECT id FROM product_category WHERE name = 'Electronics'),
        price,
        cost_price,
        tax_rate,
        stock_quantity,
        10,
        brand,
        manufacturer,
        weight,
        dimensions,
        true,
        admin_user_id,
        admin_user_id
    FROM (VALUES
        (1, 'Wireless Headphones Pro', 'Premium noise-cancelling wireless headphones', 199.99, 120.00, 7.5, 80, 'AudioTech', 'AudioTech Electronics', '320g', '20x18x8cm'),
        (2, 'Laptop Backpack Premium', 'Water-resistant laptop backpack with USB port', 79.99, 45.00, 8.75, 120, 'TravelPro', 'TravelPro Gear', '850g', '45x30x20cm'),
        (3, 'Wireless Mouse Ergonomic', 'Vertical ergonomic wireless mouse', 49.99, 25.00, 6.25, 150, 'ErgoTech', 'ErgoTech', '110g', '12x8x6cm'),
        (4, 'Mechanical Keyboard RGB', 'Gaming mechanical keyboard with RGB backlight', 129.99, 75.00, 9.5, 90, 'KeyMaster', 'KeyMaster', '1.2kg', '45x15x4cm'),
        (5, 'USB-C Hub Multi-Port', '7-in-1 USB-C hub with HDMI and SD card reader', 39.99, 20.00, 5.5, 200, 'ConnectPro', 'ConnectPro', '95g', '12x5x2cm'),
        (6, 'Monitor Stand Adjustable', 'Adjustable monitor stand with storage drawer', 34.99, 18.00, 11.25, 130, 'DeskPro', 'DeskPro', '1.8kg', '60x25x12cm'),
        (7, 'Webcam HD 1080p', 'Full HD webcam with auto-focus and microphone', 69.99, 40.00, 8.0, 100, 'CamTech', 'CamTech', '280g', '15x8x8cm'),
        (8, 'External SSD 1TB', 'Portable external SSD with USB 3.0', 149.99, 85.00, 6.75, 70, 'DataStore', 'DataStore Storage', '58g', '10x7x1cm'),
        (9, 'Wireless Earbuds Pro', 'True wireless earbuds with charging case', 89.99, 50.00, 10.5, 110, 'SoundPro', 'SoundPro Audio', '45g', '6x5x2cm'),
        (10, 'Smart Watch Fitness', 'Fitness tracker with heart rate monitor', 119.99, 70.00, 7.25, 85, 'FitTech', 'FitTech Wearables', '48g', '4.4x3.8x1.1cm'),
        (11, 'Laptop Stand Aluminum', 'Adjustable aluminum laptop stand', 44.99, 25.00, 5.75, 140, 'StandPro', 'StandPro', '650g', '28x24x2cm'),
        (12, 'Phone Stand Desktop', 'Adjustable phone stand for desk', 19.99, 10.00, 9.75, 180, 'MobilePro', 'MobilePro', '120g', '15x10x8cm'),
        (13, 'Cable Management Kit', 'Complete cable management solution', 24.99, 12.00, 6.5, 160, 'CablePro', 'CablePro', '380g', '25x15x5cm'),
        (14, 'Desk Organizer Bamboo', 'Bamboo desk organizer with multiple compartments', 29.99, 15.00, 8.25, 125, 'OrganiDesk', 'OrganiDesk', '850g', '30x20x8cm'),
        (15, 'Power Bank 20000mAh', 'High-capacity portable power bank', 54.99, 30.00, 11.75, 95, 'PowerPro', 'PowerPro', '420g', '15x7x2cm'),
        (16, 'Bluetooth Speaker Waterproof', 'Portable waterproof Bluetooth speaker', 39.99, 22.00, 7.0, 135, 'SoundWave', 'SoundWave Audio', '340g', '9x8x4cm'),
        (17, 'Car Phone Mount', 'Adjustable car phone holder', 24.99, 12.00, 5.25, 155, 'AutoPro', 'AutoPro', '180g', '12x8x10cm'),
        (18, 'Wireless Charger Fast', 'Fast wireless charging pad', 34.99, 18.00, 10.25, 115, 'ChargeTech', 'ChargeTech', '95g', '10x10x1cm'),
        (19, 'Tablet Stand Adjustable', 'Adjustable tablet stand for multiple angles', 29.99, 15.00, 8.5, 145, 'TabPro', 'TabPro', '280g', '20x15x12cm'),
        (20, 'HDMI Cable 4K 6ft', 'High-speed HDMI cable 4K support', 14.99, 7.00, 6.0, 200, 'CableTech', 'CableTech', '120g', '200x3x1cm')
    ) AS products(generate_series, name, description, price, cost_price, tax_rate, stock_quantity, brand, manufacturer, weight, dimensions);

    -- Home & Kitchen Products (20 products)
    INSERT INTO product (sku, name, description, category_id, price, cost_price, tax_rate, stock_quantity, low_stock_threshold, brand, manufacturer, weight, dimensions, is_active, created_by, updated_by)
    SELECT 
        'HOME-' || LPAD(generate_series::text, 4, '0'),
        name,
        description,
        (SELECT id FROM product_category WHERE name = 'Home & Kitchen'),
        price,
        cost_price,
        tax_rate,
        stock_quantity,
        10,
        brand,
        manufacturer,
        weight,
        dimensions,
        true,
        admin_user_id,
        admin_user_id
    FROM (VALUES
        (1, 'Stainless Steel Cookware Set', '10-piece professional cookware set', 199.99, 120.00, 8.25, 60, 'ChefMaster', 'ChefMaster Kitchens', '8.5kg', '45x35x25cm'),
        (2, 'Electric Kettle 1.7L', 'Fast-boiling cordless electric kettle', 39.99, 22.00, 8.25, 100, 'BrewPro', 'BrewPro Appliances', '1.1kg', '22x16x25cm'),
        (3, 'Coffee Maker Programmable', '12-cup programmable coffee maker with timer', 79.99, 45.00, 8.25, 75, 'BrewPro', 'BrewPro Appliances', '2.3kg', '30x20x35cm'),
        (4, 'Blender High Speed', '1500W professional blender with multiple speeds', 89.99, 50.00, 8.25, 65, 'BlendMaster', 'BlendMaster Home', '3.2kg', '20x20x42cm'),
        (5, 'Air Fryer 5.8 Quart', 'Digital air fryer with 8 preset cooking functions', 119.99, 70.00, 8.25, 85, 'CrispyChef', 'CrispyChef Kitchen', '5.4kg', '35x30x32cm'),
        (6, 'Vacuum Sealer Machine', 'Automatic vacuum sealing system for food storage', 59.99, 35.00, 8.25, 90, 'FreshKeep', 'FreshKeep Home', '1.8kg', '38x15x8cm'),
        (7, 'Knife Set Professional 15-Piece', 'High-carbon stainless steel knife set with block', 149.99, 85.00, 8.25, 50, 'SharpEdge', 'SharpEdge Cutlery', '4.2kg', '35x20x25cm'),
        (8, 'Cutting Board Bamboo Set', 'Set of 3 eco-friendly bamboo cutting boards', 29.99, 15.00, 8.25, 150, 'EcoKitchen', 'EcoKitchen', '2.1kg', '40x30x3cm'),
        (9, 'Mixing Bowl Set Stainless', 'Nesting mixing bowls with lids - 5 piece', 34.99, 18.00, 8.25, 120, 'BowlPro', 'BowlPro Kitchen', '1.5kg', '28x28x15cm'),
        (10, 'Food Storage Container Set', '24-piece airtight food storage containers', 44.99, 25.00, 8.25, 110, 'FreshKeep', 'FreshKeep Home', '2.8kg', '35x25x20cm'),
        (11, 'Dish Rack Stainless Steel', 'Large capacity dish drying rack', 39.99, 22.00, 8.25, 95, 'DrainPro', 'DrainPro Home', '1.6kg', '45x32x15cm'),
        (12, 'Spice Rack Organizer', 'Rotating spice rack with 20 glass jars', 49.99, 28.00, 8.25, 80, 'OrganiHome', 'OrganiHome', '2.4kg', '30x30x35cm'),
        (13, 'Toaster 4-Slice', 'Extra-wide slot toaster with bagel function', 54.99, 30.00, 8.25, 70, 'ToastMaster', 'ToastMaster Kitchen', '2.1kg', '35x20x20cm'),
        (14, 'Rice Cooker 10-Cup', 'Digital rice cooker with steamer basket', 69.99, 40.00, 8.25, 75, 'RicePro', 'RicePro Appliances', '3.5kg', '28x28x25cm'),
        (15, 'Pressure Cooker 6 Quart', 'Multi-function electric pressure cooker', 99.99, 60.00, 8.25, 65, 'QuickCook', 'QuickCook Kitchen', '5.8kg', '32x32x33cm'),
        (16, 'Kitchen Scale Digital', 'Precision digital food scale with bowl', 24.99, 12.00, 8.25, 140, 'WeighRight', 'WeighRight Home', '680g', '20x18x5cm'),
        (17, 'Can Opener Electric', 'Automatic can opener with knife sharpener', 29.99, 15.00, 8.25, 100, 'OpenEasy', 'OpenEasy Kitchen', '850g', '22x10x18cm'),
        (18, 'Utensil Set Silicone', '12-piece heat-resistant cooking utensils', 34.99, 18.00, 8.25, 130, 'CookPro', 'CookPro Kitchen', '980g', '35x25x8cm'),
        (19, 'Dish Soap Dispenser Pump', 'Automatic touchless soap dispenser', 19.99, 10.00, 8.25, 180, 'CleanHome', 'CleanHome', '420g', '12x8x18cm'),
        (20, 'Kitchen Timer Digital', 'Magnetic timer with large display', 14.99, 7.00, 8.25, 200, 'TimePro', 'TimePro Home', '120g', '8x8x2cm')
    ) AS products(generate_series, name, description, price, cost_price, tax_rate, stock_quantity, brand, manufacturer, weight, dimensions);

    -- Sports & Outdoors Products (20 products)
    INSERT INTO product (sku, name, description, category_id, price, cost_price, tax_rate, stock_quantity, low_stock_threshold, brand, manufacturer, weight, dimensions, is_active, created_by, updated_by)
    SELECT 
        'SPRT-' || LPAD(generate_series::text, 4, '0'),
        name,
        description,
        (SELECT id FROM product_category WHERE name = 'Sports & Outdoors'),
        price,
        cost_price,
        tax_rate,
        stock_quantity,
        10,
        brand,
        manufacturer,
        weight,
        dimensions,
        true,
        admin_user_id,
        admin_user_id
    FROM (VALUES
        (1, 'Yoga Mat Premium', 'Extra thick non-slip exercise mat with carrying strap', 29.99, 15.00, 8.25, 200, 'YogaFit', 'YogaFit Sports', '1.2kg', '183x61x1cm'),
        (2, 'Resistance Bands Set', 'Set of 5 resistance bands with handles and door anchor', 24.99, 12.00, 8.25, 180, 'FitBand', 'FitBand Fitness', '680g', '30x20x5cm'),
        (3, 'Dumbbell Set Adjustable', 'Pair of adjustable dumbbells 5-25 lbs', 149.99, 85.00, 8.25, 60, 'IronFit', 'IronFit Equipment', '12kg', '40x20x20cm'),
        (4, 'Jump Rope Speed', 'Professional speed jump rope with ball bearings', 12.99, 6.00, 8.25, 250, 'JumpPro', 'JumpPro Sports', '180g', '280x3x3cm'),
        (5, 'Foam Roller Massage', 'High-density foam roller for muscle recovery', 19.99, 10.00, 8.25, 150, 'RecoverFit', 'RecoverFit', '450g', '33x14x14cm'),
        (6, 'Water Bottle Insulated 32oz', 'Stainless steel vacuum insulated bottle', 24.99, 12.00, 8.25, 220, 'HydroMax', 'HydroMax', '380g', '28x8x8cm'),
        (7, 'Camping Tent 4-Person', 'Waterproof family camping tent with rainfly', 159.99, 95.00, 8.25, 45, 'OutdoorPro', 'OutdoorPro Gear', '6.5kg', '60x25x25cm'),
        (8, 'Sleeping Bag Lightweight', 'Compact sleeping bag for 3-season camping', 49.99, 28.00, 8.25, 80, 'SleepWell', 'SleepWell Outdoor', '1.4kg', '38x20x20cm'),
        (9, 'Hiking Backpack 50L', 'Durable hiking backpack with rain cover', 89.99, 50.00, 8.25, 65, 'TrailMaster', 'TrailMaster Gear', '1.8kg', '65x35x25cm'),
        (10, 'Trekking Poles Adjustable', 'Pair of lightweight aluminum trekking poles', 34.99, 18.00, 8.25, 100, 'HikePro', 'HikePro Equipment', '520g', '65x10x10cm'),
        (11, 'Bike Helmet Adult', 'Adjustable cycling helmet with LED light', 44.99, 25.00, 8.25, 90, 'SafeRide', 'SafeRide Sports', '320g', '28x22x16cm'),
        (12, 'Bike Lock Heavy Duty', 'U-lock with cable for maximum security', 39.99, 22.00, 8.25, 110, 'LockTight', 'LockTight Security', '1.2kg', '30x15x5cm'),
        (13, 'Fishing Rod Combo', 'Spinning rod and reel combo for freshwater', 79.99, 45.00, 8.25, 55, 'CatchMaster', 'CatchMaster Fishing', '680g', '180x8x8cm'),
        (14, 'Cooler 30 Quart', 'Insulated cooler with wheels', 69.99, 40.00, 8.25, 70, 'ChillBox', 'ChillBox Outdoor', '5.2kg', '55x35x40cm'),
        (15, 'Hammock Portable Double', 'Lightweight parachute hammock with straps', 34.99, 18.00, 8.25, 120, 'RelaxPro', 'RelaxPro Outdoor', '680g', '28x15x15cm'),
        (16, 'Headlamp LED Rechargeable', 'Bright LED headlamp with multiple modes', 24.99, 12.00, 8.25, 140, 'BeamBright', 'BeamBright', '95g', '8x6x4cm'),
        (17, 'Camping Stove Portable', 'Compact gas camping stove with case', 29.99, 15.00, 8.25, 95, 'CookCamp', 'CookCamp Gear', '420g', '18x12x10cm'),
        (18, 'First Aid Kit Outdoor', 'Comprehensive 200-piece first aid kit', 39.99, 22.00, 8.25, 100, 'SafeCamp', 'SafeCamp Medical', '780g', '22x15x8cm'),
        (19, 'Sunglasses Polarized Sport', 'UV protection polarized sports sunglasses', 29.99, 15.00, 8.25, 160, 'SunShield', 'SunShield Optics', '28g', '15x6x5cm'),
        (20, 'Fitness Tracker Watch', 'Waterproof activity tracker with heart rate monitor', 49.99, 28.00, 8.25, 130, 'FitTrack', 'FitTrack Tech', '35g', '4x4x1cm')
    ) AS products(generate_series, name, description, price, cost_price, tax_rate, stock_quantity, brand, manufacturer, weight, dimensions);

    -- Books & Media Products (20 products)
    INSERT INTO product (sku, name, description, category_id, price, cost_price, tax_rate, stock_quantity, low_stock_threshold, brand, manufacturer, weight, dimensions, is_active, created_by, updated_by)
    SELECT 
        'BOOK-' || LPAD(generate_series::text, 4, '0'),
        name,
        description,
        (SELECT id FROM product_category WHERE name = 'Books & Media'),
        price,
        cost_price,
        tax_rate,
        stock_quantity,
        10,
        brand,
        manufacturer,
        weight,
        dimensions,
        true,
        admin_user_id,
        admin_user_id
    FROM (VALUES
        (1, 'The Art of Programming', 'Comprehensive guide to software development', 49.99, 25.00, 8.25, 100, 'TechBooks', 'TechBooks Publishing', '850g', '24x18x3cm'),
        (2, 'Modern Web Development', 'Learn modern web technologies and frameworks', 54.99, 28.00, 8.25, 85, 'CodePress', 'CodePress', '920g', '24x18x3cm'),
        (3, 'Data Science Handbook', 'Complete guide to data science and analytics', 59.99, 30.00, 8.25, 75, 'DataBooks', 'DataBooks Inc', '1.1kg', '26x20x4cm'),
        (4, 'Machine Learning Basics', 'Introduction to machine learning algorithms', 44.99, 22.00, 8.25, 90, 'AIPress', 'AIPress Publishing', '780g', '23x17x2cm'),
        (5, 'Cloud Computing Guide', 'Master cloud platforms and architecture', 52.99, 26.00, 8.25, 80, 'CloudBooks', 'CloudBooks', '890g', '24x18x3cm'),
        (6, 'Cybersecurity Essentials', 'Protect systems and data from threats', 47.99, 24.00, 8.25, 95, 'SecurePress', 'SecurePress', '820g', '24x18x3cm'),
        (7, 'Business Strategy 101', 'Essential business planning and strategy', 39.99, 20.00, 8.25, 110, 'BizBooks', 'BizBooks Publishing', '680g', '23x15x2cm'),
        (8, 'Digital Marketing Mastery', 'Complete guide to online marketing', 42.99, 21.00, 8.25, 100, 'MarketPress', 'MarketPress', '720g', '23x16x2cm'),
        (9, 'Photography Fundamentals', 'Learn the art of digital photography', 44.99, 22.00, 8.25, 85, 'PhotoBooks', 'PhotoBooks', '950g', '26x22x2cm'),
        (10, 'Graphic Design Principles', 'Master visual design and composition', 49.99, 25.00, 8.25, 75, 'DesignPress', 'DesignPress', '1.2kg', '28x24x3cm'),
        (11, 'Cooking Around the World', 'International recipes and techniques', 34.99, 17.00, 8.25, 120, 'CookBooks', 'CookBooks Publishing', '980g', '26x20x3cm'),
        (12, 'Fitness and Nutrition Guide', 'Complete health and wellness handbook', 29.99, 15.00, 8.25, 130, 'HealthPress', 'HealthPress', '620g', '23x15x2cm'),
        (13, 'Meditation and Mindfulness', 'Practical guide to mental wellness', 24.99, 12.00, 8.25, 140, 'MindBooks', 'MindBooks', '420g', '21x14x1cm'),
        (14, 'Travel Photography Tips', 'Capture amazing travel moments', 32.99, 16.00, 8.25, 95, 'TravelPress', 'TravelPress', '580g', '22x16x2cm'),
        (15, 'Home Gardening Basics', 'Grow your own vegetables and herbs', 27.99, 14.00, 8.25, 110, 'GardenBooks', 'GardenBooks', '720g', '24x18x2cm'),
        (16, 'DIY Home Improvement', 'Essential home repair and renovation', 36.99, 18.00, 8.25, 90, 'HomePress', 'HomePress', '880g', '25x19x3cm'),
        (17, 'Personal Finance Guide', 'Master your money and investments', 31.99, 16.00, 8.25, 105, 'MoneyBooks', 'MoneyBooks', '520g', '22x15x2cm'),
        (18, 'Leadership and Management', 'Develop effective leadership skills', 41.99, 21.00, 8.25, 85, 'LeadPress', 'LeadPress Publishing', '680g', '23x16x2cm'),
        (19, 'Creative Writing Workshop', 'Improve your writing craft', 28.99, 14.00, 8.25, 100, 'WriteBooks', 'WriteBooks', '480g', '21x14x2cm'),
        (20, 'Music Theory Fundamentals', 'Learn the basics of music composition', 33.99, 17.00, 8.25, 95, 'MusicPress', 'MusicPress', '620g', '23x17x2cm')
    ) AS products(generate_series, name, description, price, cost_price, tax_rate, stock_quantity, brand, manufacturer, weight, dimensions);

    -- Clothing & Accessories Products (20 products)
    INSERT INTO product (sku, name, description, category_id, price, cost_price, tax_rate, stock_quantity, low_stock_threshold, brand, manufacturer, weight, dimensions, is_active, created_by, updated_by)
    SELECT 
        'CLTH-' || LPAD(generate_series::text, 4, '0'),
        name,
        description,
        (SELECT id FROM product_category WHERE name = 'Clothing & Accessories'),
        price,
        cost_price,
        tax_rate,
        stock_quantity,
        10,
        brand,
        manufacturer,
        weight,
        dimensions,
        true,
        admin_user_id,
        admin_user_id
    FROM (VALUES
        (1, 'Cotton T-Shirt Classic', 'Premium cotton crew neck t-shirt', 19.99, 8.00, 8.25, 300, 'ComfortWear', 'ComfortWear Apparel', '180g', 'M: 71x51cm'),
        (2, 'Denim Jeans Slim Fit', 'Classic slim fit denim jeans', 49.99, 25.00, 8.25, 150, 'DenimPro', 'DenimPro Fashion', '520g', '32x32 inches'),
        (3, 'Hoodie Pullover', 'Comfortable fleece pullover hoodie', 39.99, 20.00, 8.25, 180, 'CozyWear', 'CozyWear', '480g', 'L: 73x58cm'),
        (4, 'Running Shoes Athletic', 'Lightweight running shoes with cushioning', 79.99, 40.00, 8.25, 120, 'RunFast', 'RunFast Sports', '280g', 'Size 10'),
        (5, 'Leather Belt Classic', 'Genuine leather belt with metal buckle', 29.99, 12.00, 8.25, 200, 'BeltCraft', 'BeltCraft', '180g', '110cm x 3.5cm'),
        (6, 'Baseball Cap Adjustable', 'Cotton baseball cap with adjustable strap', 14.99, 6.00, 8.25, 250, 'CapStyle', 'CapStyle Hats', '85g', 'One Size'),
        (7, 'Backpack Canvas', 'Durable canvas backpack for daily use', 44.99, 22.00, 8.25, 140, 'BagPro', 'BagPro', '680g', '45x30x15cm'),
        (8, 'Wallet Leather Bifold', 'Slim leather bifold wallet with RFID blocking', 24.99, 10.00, 8.25, 180, 'WalletCraft', 'WalletCraft', '95g', '11x9x2cm'),
        (9, 'Sunglasses Classic Aviator', 'Timeless aviator style sunglasses', 34.99, 15.00, 8.25, 160, 'ShadeStyle', 'ShadeStyle Optics', '32g', '14x5x5cm'),
        (10, 'Watch Analog Casual', 'Stainless steel casual watch', 59.99, 30.00, 8.25, 100, 'TimeStyle', 'TimeStyle Watches', '120g', '4cm diameter'),
        (11, 'Scarf Wool Winter', 'Warm wool scarf for cold weather', 24.99, 10.00, 8.25, 150, 'WarmWear', 'WarmWear', '180g', '180x30cm'),
        (12, 'Gloves Leather Touchscreen', 'Leather gloves with touchscreen fingertips', 29.99, 12.00, 8.25, 130, 'GloveTech', 'GloveTech', '95g', 'Size L'),
        (13, 'Socks Athletic 6-Pack', 'Moisture-wicking athletic socks', 19.99, 8.00, 8.25, 220, 'SockFit', 'SockFit', '240g', 'Size 9-11'),
        (14, 'Tie Silk Classic', 'Premium silk necktie', 24.99, 10.00, 8.25, 140, 'TieStyle', 'TieStyle', '65g', '145x8cm'),
        (15, 'Dress Shirt Button-Down', 'Classic cotton dress shirt', 39.99, 18.00, 8.25, 160, 'ShirtPro', 'ShirtPro Fashion', '280g', 'Size L'),
        (16, 'Sneakers Canvas Low-Top', 'Casual canvas sneakers', 44.99, 22.00, 8.25, 170, 'SneakerStyle', 'SneakerStyle', '320g', 'Size 10'),
        (17, 'Jacket Windbreaker', 'Lightweight windbreaker jacket', 54.99, 28.00, 8.25, 110, 'OuterWear', 'OuterWear', '380g', 'Size M'),
        (18, 'Shorts Athletic', 'Quick-dry athletic shorts', 24.99, 10.00, 8.25, 190, 'SportWear', 'SportWear', '150g', 'Size M'),
        (19, 'Beanie Winter Knit', 'Warm knit beanie hat', 14.99, 6.00, 8.25, 200, 'HatCraft', 'HatCraft', '75g', 'One Size'),
        (20, 'Umbrella Compact Auto', 'Automatic compact travel umbrella', 19.99, 8.00, 8.25, 180, 'RainShield', 'RainShield', '320g', '30cm folded')
    ) AS products(generate_series, name, description, price, cost_price, tax_rate, stock_quantity, brand, manufacturer, weight, dimensions);

    -- Add Product URLs (using Unsplash public domain images)
    -- Electronics URLs
    INSERT INTO product_url (product_id, url, url_type, alt_text, display_order, is_primary, created_by)
    SELECT 
        p.id,
        CASE 
            WHEN p.name LIKE '%Headphones%' THEN 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'
            WHEN p.name LIKE '%Charger%' THEN 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0'
            WHEN p.name LIKE '%Keyboard%' THEN 'https://images.unsplash.com/photo-1587829741301-dc798b83add3'
            WHEN p.name LIKE '%Mouse%' THEN 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46'
            WHEN p.name LIKE '%Monitor%' THEN 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf'
            WHEN p.name LIKE '%SSD%' THEN 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b'
            WHEN p.name LIKE '%Webcam%' THEN 'https://images.unsplash.com/photo-1614624532983-4ce03382d63d'
            WHEN p.name LIKE '%Earbuds%' THEN 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df'
            WHEN p.name LIKE '%Watch%' THEN 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'
            WHEN p.name LIKE '%Laptop Stand%' THEN 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45'
            WHEN p.name LIKE '%USB Hub%' THEN 'https://images.unsplash.com/photo-1625948515291-69613efd103f'
            WHEN p.name LIKE '%Speaker%' THEN 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1'
            WHEN p.name LIKE '%Tablet%' THEN 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3'
            WHEN p.name LIKE '%Lamp%' THEN 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c'
            WHEN p.name LIKE '%Cable%' THEN 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64'
            WHEN p.name LIKE '%Phone Stand%' THEN 'https://images.unsplash.com/photo-1598327105666-5b89351aff97'
            WHEN p.name LIKE '%HDMI%' THEN 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64'
            WHEN p.name LIKE '%Surge%' THEN 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5'
            WHEN p.name LIKE '%Microphone%' THEN 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc'
            WHEN p.name LIKE '%Router%' THEN 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2'
            ELSE 'https://images.unsplash.com/photo-1512820790803-83ca734da794'
        END,
        0,
        p.name || ' product image',
        0,
        true,
        admin_user_id
    FROM product p
    WHERE p.sku LIKE 'ELEC-%';

    -- Home & Kitchen URLs
    INSERT INTO product_url (product_id, url, url_type, alt_text, display_order, is_primary, created_by)
    SELECT 
        p.id,
        CASE 
            WHEN p.name LIKE '%Cookware%' THEN 'https://images.unsplash.com/photo-1556911220-bff31c812dba'
            WHEN p.name LIKE '%Kettle%' THEN 'https://images.unsplash.com/photo-1563636619-e9143da7973b'
            WHEN p.name LIKE '%Coffee%' THEN 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6'
            WHEN p.name LIKE '%Blender%' THEN 'https://images.unsplash.com/photo-1585515320310-259814833e62'
            WHEN p.name LIKE '%Air Fryer%' THEN 'https://images.unsplash.com/photo-1585515320310-259814833e62'
            WHEN p.name LIKE '%Vacuum Sealer%' THEN 'https://images.unsplash.com/photo-1585515320310-259814833e62'
            WHEN p.name LIKE '%Knife%' THEN 'https://images.unsplash.com/photo-1593618998160-e34014e67546'
            WHEN p.name LIKE '%Cutting Board%' THEN 'https://images.unsplash.com/photo-1594756202469-9ff9799b2e4e'
            WHEN p.name LIKE '%Bowl%' THEN 'https://images.unsplash.com/photo-1610701596007-11502861dcfa'
            WHEN p.name LIKE '%Container%' THEN 'https://images.unsplash.com/photo-1584308972272-9e4e7685e80f'
            WHEN p.name LIKE '%Dish Rack%' THEN 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a'
            WHEN p.name LIKE '%Spice%' THEN 'https://images.unsplash.com/photo-1596040033229-a0b3b1c0c3e4'
            WHEN p.name LIKE '%Toaster%' THEN 'https://images.unsplash.com/photo-1598511726623-d2e9996892f0'
            WHEN p.name LIKE '%Rice Cooker%' THEN 'https://images.unsplash.com/photo-1585515320310-259814833e62'
            WHEN p.name LIKE '%Pressure Cooker%' THEN 'https://images.unsplash.com/photo-1585515320310-259814833e62'
            WHEN p.name LIKE '%Scale%' THEN 'https://images.unsplash.com/photo-1609709295948-17d77cb2a69b'
            WHEN p.name LIKE '%Can Opener%' THEN 'https://images.unsplash.com/photo-1585515320310-259814833e62'
            WHEN p.name LIKE '%Utensil%' THEN 'https://images.unsplash.com/photo-1595251612970-be2832f80e60'
            WHEN p.name LIKE '%Soap%' THEN 'https://images.unsplash.com/photo-1600857062241-98e5dba60f2f'
            WHEN p.name LIKE '%Timer%' THEN 'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5'
            ELSE 'https://images.unsplash.com/photo-1584308972272-9e4e7685e80f'
        END,
        0,
        p.name || ' product image',
        0,
        true,
        admin_user_id
    FROM product p
    WHERE p.sku LIKE 'HOME-%';

    -- Sports & Outdoors URLs
    INSERT INTO product_url (product_id, url, url_type, alt_text, display_order, is_primary, created_by)
    SELECT 
        p.id,
        CASE 
            WHEN p.name LIKE '%Yoga Mat%' THEN 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f'
            WHEN p.name LIKE '%Resistance%' THEN 'https://images.unsplash.com/photo-1598289431512-b97b0917affc'
            WHEN p.name LIKE '%Dumbbell%' THEN 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438'
            WHEN p.name LIKE '%Jump Rope%' THEN 'https://images.unsplash.com/photo-1598289431512-b97b0917affc'
            WHEN p.name LIKE '%Foam Roller%' THEN 'https://images.unsplash.com/photo-1598289431512-b97b0917affc'
            WHEN p.name LIKE '%Water Bottle%' THEN 'https://images.unsplash.com/photo-1602143407151-7111542de6e8'
            WHEN p.name LIKE '%Tent%' THEN 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4'
            WHEN p.name LIKE '%Sleeping Bag%' THEN 'https://images.unsplash.com/photo-1487730116645-74489c95b41b'
            WHEN p.name LIKE '%Backpack%' THEN 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62'
            WHEN p.name LIKE '%Trekking%' THEN 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256'
            WHEN p.name LIKE '%Helmet%' THEN 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64'
            WHEN p.name LIKE '%Lock%' THEN 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64'
            WHEN p.name LIKE '%Fishing%' THEN 'https://images.unsplash.com/photo-1544552866-d3ed42536cfd'
            WHEN p.name LIKE '%Cooler%' THEN 'https://images.unsplash.com/photo-1565958011703-44f9829ba187'
            WHEN p.name LIKE '%Hammock%' THEN 'https://images.unsplash.com/photo-1573920111312-04f1b25c6b85'
            WHEN p.name LIKE '%Headlamp%' THEN 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64'
            WHEN p.name LIKE '%Stove%' THEN 'https://images.unsplash.com/photo-1504851149312-7a075b496cc7'
            WHEN p.name LIKE '%First Aid%' THEN 'https://images.unsplash.com/photo-1603398938378-e54eab446dde'
            WHEN p.name LIKE '%Sunglasses%' THEN 'https://images.unsplash.com/photo-1511499767150-a48a237f0083'
            WHEN p.name LIKE '%Fitness Tracker%' THEN 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6'
            ELSE 'https://images.unsplash.com/photo-1573920111312-04f1b25c6b85'
        END,
        0,
        p.name || ' product image',
        0,
        true,
        admin_user_id
    FROM product p
    WHERE p.sku LIKE 'SPRT-%';

    -- Books & Media URLs
    INSERT INTO product_url (product_id, url, url_type, alt_text, display_order, is_primary, created_by)
    SELECT 
        p.id,
        CASE 
            WHEN p.name LIKE '%Programming%' THEN 'https://images.unsplash.com/photo-1532012197267-da84d127e765'
            WHEN p.name LIKE '%Web Development%' THEN 'https://images.unsplash.com/photo-1532012197267-da84d127e765'
            WHEN p.name LIKE '%Data Science%' THEN 'https://images.unsplash.com/photo-1532012197267-da84d127e765'
            WHEN p.name LIKE '%Machine Learning%' THEN 'https://images.unsplash.com/photo-1532012197267-da84d127e765'
            WHEN p.name LIKE '%Cloud%' THEN 'https://images.unsplash.com/photo-1532012197267-da84d127e765'
            WHEN p.name LIKE '%Cybersecurity%' THEN 'https://images.unsplash.com/photo-1532012197267-da84d127e765'
            WHEN p.name LIKE '%Business%' THEN 'https://images.unsplash.com/photo-1507842217343-583bb7270b66'
            WHEN p.name LIKE '%Marketing%' THEN 'https://images.unsplash.com/photo-1507842217343-583bb7270b66'
            WHEN p.name LIKE '%Photography%' THEN 'https://images.unsplash.com/photo-1512820790803-83ca734da794'
            WHEN p.name LIKE '%Design%' THEN 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634'
            WHEN p.name LIKE '%Cooking%' THEN 'https://images.unsplash.com/photo-1512820790803-83ca734da794'
            WHEN p.name LIKE '%Fitness%' THEN 'https://images.unsplash.com/photo-1512820790803-83ca734da794'
            WHEN p.name LIKE '%Meditation%' THEN 'https://images.unsplash.com/photo-1512820790803-83ca734da794'
            WHEN p.name LIKE '%Travel%' THEN 'https://images.unsplash.com/photo-1512820790803-83ca734da794'
            WHEN p.name LIKE '%Gardening%' THEN 'https://images.unsplash.com/photo-1512820790803-83ca734da794'
            WHEN p.name LIKE '%Home Improvement%' THEN 'https://images.unsplash.com/photo-1512820790803-83ca734da794'
            WHEN p.name LIKE '%Finance%' THEN 'https://images.unsplash.com/photo-1507842217343-583bb7270b66'
            WHEN p.name LIKE '%Leadership%' THEN 'https://images.unsplash.com/photo-1507842217343-583bb7270b66'
            WHEN p.name LIKE '%Writing%' THEN 'https://images.unsplash.com/photo-1512820790803-83ca734da794'
            WHEN p.name LIKE '%Music%' THEN 'https://images.unsplash.com/photo-1507838153414-b4b713384a76'
            ELSE 'https://images.unsplash.com/photo-1532012197267-da84d127e765'
        END,
        0,
        p.name || ' product image',
        0,
        true,
        admin_user_id
    FROM product p
    WHERE p.sku LIKE 'BOOK-%';

    -- Clothing & Accessories URLs
    INSERT INTO product_url (product_id, url, url_type, alt_text, display_order, is_primary, created_by)
    SELECT 
        p.id,
        CASE 
            WHEN p.name LIKE '%T-Shirt%' THEN 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab'
            WHEN p.name LIKE '%Jeans%' THEN 'https://images.unsplash.com/photo-1542272604-787c3835535d'
            WHEN p.name LIKE '%Hoodie%' THEN 'https://images.unsplash.com/photo-1556821840-3a63f95609a7'
            WHEN p.name LIKE '%Shoes%' THEN 'https://images.unsplash.com/photo-1542291026-7eec264c27ff'
            WHEN p.name LIKE '%Belt%' THEN 'https://images.unsplash.com/photo-1624222247344-550fb60583aa'
            WHEN p.name LIKE '%Cap%' THEN 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b'
            WHEN p.name LIKE '%Backpack%' THEN 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62'
            WHEN p.name LIKE '%Wallet%' THEN 'https://images.unsplash.com/photo-1627123424574-724758594e93'
            WHEN p.name LIKE '%Sunglasses%' THEN 'https://images.unsplash.com/photo-1511499767150-a48a237f0083'
            WHEN p.name LIKE '%Watch%' THEN 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'
            WHEN p.name LIKE '%Scarf%' THEN 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9'
            WHEN p.name LIKE '%Gloves%' THEN 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9'
            WHEN p.name LIKE '%Socks%' THEN 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82'
            WHEN p.name LIKE '%Tie%' THEN 'https://images.unsplash.com/photo-1589756823695-278bc8356c60'
            WHEN p.name LIKE '%Shirt%' THEN 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c'
            WHEN p.name LIKE '%Sneakers%' THEN 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77'
            WHEN p.name LIKE '%Jacket%' THEN 'https://images.unsplash.com/photo-1551028719-00167b16eac5'
            WHEN p.name LIKE '%Shorts%' THEN 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b'
            WHEN p.name LIKE '%Beanie%' THEN 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531'
            WHEN p.name LIKE '%Umbrella%' THEN 'https://images.unsplash.com/photo-1527693224012-e12255d5a6e3'
            ELSE 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab'
        END,
        0,
        p.name || ' product image',
        0,
        true,
        admin_user_id
    FROM product p
    WHERE p.sku LIKE 'CLTH-%';

END $$;
