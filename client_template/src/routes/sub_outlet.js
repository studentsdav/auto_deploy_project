const express = require('express');
const { getPool } = require('../config/db'); // Database connection

const router = express.Router();

// GET all outlet configurations
router.get('/suboutlets', async (req, res) => {
    try {
        const pool = getPool(req);
        const result = await pool.query('SELECT * FROM suboutlet_configurations');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve outlet configurations', details: error.message });
    }
});

// GET outlet configuration by propertyid
router.get('/suboutlets/:propertyId', async (req, res) => {
    const outletId = req.params.propertyId;
    try {
        const pool = getPool(req);
        const result = await pool.query('SELECT * FROM suboutlet_configurations WHERE property_id = $1', [outletId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Outlet configuration not found' });
        }
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve outlet configuration', details: error.message });
    }
});

// GET outlet configuration by ID
router.get('/outlet/:id', async (req, res) => {
    const outletId = req.params.id;
    try {
        const pool = getPool(req);
        const result = await pool.query('SELECT * FROM suboutlet_configurations WHERE property_id = $1', [outletId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Outlet configuration not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve outlet configuration', details: error.message });
    }
});

// POST (Create) new outlet configuration
router.post('/suboutlets', async (req, res) => {
    const {
        property_id,
        outlet_name,
        address,
        city,
        country,
        state,
        contact_number,
        manager_name,
        opening_hours,
        currency, sub_outlet
    } = req.body;

    try {
        const pool = getPool(req);
        const result = await pool.query(
            `INSERT INTO suboutlet_configurations (property_id, outlet_name, address, city, country, state, contact_number, manager_name, opening_hours, currency, sub_outlet)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
            [property_id, outlet_name, address, city, country, state, contact_number, manager_name, opening_hours, currency, sub_outlet]
        );
        res.status(201).json({ message: 'Outlet configuration created successfully', outletId: result.rows[0].id });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create outlet configuration', details: error.message });
    }
});

// PUT (Update) outlet configuration by ID
router.put('/suboutlets/:id', async (req, res) => {
    const outletId = req.params.id;
    const {
        outlet_name,
        address,
        city,
        country,
        state,
        contact_number,
        manager_name,
        opening_hours,
        currency,
    } = req.body;

    try {
        const pool = getPool(req);
        const result = await pool.query(
            `UPDATE suboutlet_configurations
      SET outlet_name = $1, address = $2, city = $3, country = $4, state = $5, contact_number = $6, manager_name = $7,
          opening_hours = $8, currency = $9, updated_at = CURRENT_TIMESTAMP
      WHERE id = $10 RETURNING id`,
            [
                outlet_name, address, city, country, state, contact_number, manager_name, opening_hours, currency, outletId
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Outlet configuration not found' });
        }

        res.status(200).json({ message: 'Outlet configuration updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update outlet configuration', details: error.message });
    }
});

// DELETE outlet configuration by ID
router.delete('/suboutlets/:id', async (req, res) => {
    const outletId = req.params.id;
    try {
        const pool = getPool(req);
        const result = await pool.query('DELETE FROM suboutlet_configurations WHERE id = $1 RETURNING id', [outletId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Outlet configuration not found' });
        }
        res.status(200).json({ message: 'Outlet configuration deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete outlet configuration', details: error.message });
    }
});

module.exports = router;
