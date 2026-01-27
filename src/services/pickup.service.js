const prisma = require('../../prisma');

// Получить все активные точки
async function getAllPickupLocations() {
    return prisma.pickupLocation.findMany({ where: { active: true } });
}

// Получить точку по id
async function getPickupLocationById(id) {
    return prisma.pickupLocation.findUnique({ where: { id: parseInt(id) } });
}

// Создать точку (админ)
async function createPickupLocation(data) {
    return prisma.pickupLocation.create({ data });
}

// Обновить точку (админ)
async function updatePickupLocation(id, data) {
    return prisma.pickupLocation.update({
        where: { id: parseInt(id) },
        data
    });
}

// Удалить точку (админ)
async function deletePickupLocation(id) {
    return prisma.pickupLocation.delete({ where: { id: parseInt(id) } });
}

module.exports = {
    getAllPickupLocations,
    getPickupLocationById,
    createPickupLocation,
    updatePickupLocation,
    deletePickupLocation
};
