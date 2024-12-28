-- Table: test

CREATE TABLE test (
    sno SERIAL PRIMARY KEY,                     -- Auto-incremented serial number
    property_id VARCHAR(50) UNIQUE NOT NULL,    -- Property ID (WIPLdatemonthyearhoursec format)
    property_name VARCHAR(255) NOT NULL,        -- Property name
    address TEXT NOT NULL,                     -- Property address
    contact_number VARCHAR(20) NOT NULL,       -- Property contact number
    email VARCHAR(255),                        -- Property email address
    business_hours VARCHAR(255),               -- Business hours for the property
    tax_reg_no VARCHAR(50),                    -- Tax Registration Number
    state VARCHAR(100),                        -- Property state
    district VARCHAR(100),                     -- Property district
    country VARCHAR(100),                      -- Property country
    currency VARCHAR(10),                      -- Currency used for transactions (e.g., ₹, $, €)
    is_saved BOOLEAN DEFAULT FALSE,            -- Whether the property data is saved
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Timestamp for creation
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- Timestamp for updates
    status VARCHAR(50)
);
