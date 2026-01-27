const pickupService = require('../services/pickup.service');

// GET /pickup
async function getPickupLocations(req, res) {
    try {
        const locations = await pickupService.getAllPickupLocations();
        res.json(locations);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

// GET /pickup/:id
async function getPickupLocation(req, res) {
    try {
        const location = await pickupService.getPickupLocationById(req.params.id);
        if (!location) return res.status(404).json({ error: 'Pickup location not found' });
        res.json(location);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

// POST /pickup/admin
async function createPickup(req, res) {
    try {
        const location = await pickupService.createPickupLocation(req.body);
        res.json(location);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
}

// PUT /pickup/admin/:id
async function updatePickup(req, res) {
    try {
        const location = await pickupService.updatePickupLocation(req.params.id, req.body);
        res.json(location);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
}

// DELETE /pickup/admin/:id
async function deletePickup(req, res) {
    try {
        await pickupService.deletePickupLocation(req.params.id);
        res.json({ message: 'Pickup location deleted' });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
}

module.exports = {
    getPickupLocations,
    getPickupLocation,
    createPickup,
    updatePickup,
    deletePickup
};
