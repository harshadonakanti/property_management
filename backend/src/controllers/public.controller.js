const { Amenity, Organization, Property } = require('../models');

const getPublicAmenities = async (req, res, next) => {
  try {
    const { organizationID } = req.query;

    if (!organizationID) {
      return res.status(400).json({ success: false, message: 'organizationID query parameter is required' });
    }

    const org = await Organization.findOne({ where: { org_code: organizationID, is_active: true } });
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    const amenities = await Amenity.findAll({
      where: { organization_id: org.id, is_active: true },
      include: [
        {
          model: Property,
          as: 'properties',
          attributes: ['id', 'name', 'code'],
          through: { attributes: [] }
        }
      ]
    });

    return res.json({
      success: true,
      message: 'Amenities retrieved successfully',
      data: {
        organizationName: org.name,
        organizationCode: org.org_code,
        amenities
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPublicAmenities };
