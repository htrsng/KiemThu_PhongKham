const Material = require('../models/Material');
const InventoryLog = require('../models/InventoryLog');

exports.deductMaterials = async (req, res, next) => {
  try {
    const { appointmentId, materialsUsed } = req.body;
    // materialsUsed: [{ materialId: '...', quantity: 1 }]

    if (!materialsUsed || materialsUsed.length === 0) {
      return res.status(400).json({ error: 'No materials provided' });
    }

    for (const item of materialsUsed) {
      const material = await Material.findById(item.materialId);
      if (!material) continue;

      if (material.quantity < item.quantity) {
        return res.status(400).json({ error: `Not enough quantity for ${material.name}` });
      }

      material.quantity -= item.quantity;
      await material.save();

      await InventoryLog.create({
        materialId: material._id,
        action: 'export',
        quantity: item.quantity,
        reference: appointmentId,
        notes: 'Dùng cho ca khám',
        performedBy: req.user._id,
      });
    }

    res.json({ message: 'Materials deducted successfully' });
  } catch (error) {
    next(error);
  }
};
