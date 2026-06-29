const { Amenity, Property, PropertyAmenity, Organization, sequelize } = require('../models');
const { logAudit } = require('../utils/audit');
const { Op } = require('sequelize');

const getAmenities = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'DESC', propertyId = '' } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { is_active: true };

    if (!req.user.roles.includes('Super Administrator')) {
      whereClause.organization_id = req.user.organization_id;
    } else if (req.query.organizationId) {
      whereClause.organization_id = req.query.organizationId;
    }

    if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` };
    }

    const includeOptions = [
      {
        model: Organization,
        as: 'organization',
        attributes: ['name', 'org_code']
      },
      {
        model: Property,
        as: 'properties',
        attributes: ['id', 'name', 'code'],
        through: { attributes: [] }
      }
    ];

    if (propertyId) {
      includeOptions[1].where = { id: propertyId };
    }

    const { count, rows } = await Amenity.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: includeOptions,
      distinct: true
    });

    return res.json({
      success: true,
      message: 'Amenities retrieved successfully',
      data: {
        amenities: rows,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAmenityById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const whereClause = { id, is_active: true };

    if (!req.user.roles.includes('Super Administrator')) {
      whereClause.organization_id = req.user.organization_id;
    }

    const amenity = await Amenity.findOne({
      where: whereClause,
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['name', 'org_code']
        },
        {
          model: Property,
          as: 'properties',
          attributes: ['id', 'name', 'code'],
          through: { attributes: [] }
        }
      ]
    });

    if (!amenity) {
      return res.status(404).json({ success: false, message: 'Amenity not found' });
    }

    return res.json({
      success: true,
      message: 'Amenity retrieved successfully',
      data: amenity
    });
  } catch (error) {
    next(error);
  }
};

const createAmenity = async (req, res, next) => {
  try {
    const { name, description, capacity, hourly_rate, opening_time, closing_time, booking_rules, propertyIds } = req.body;

    if (!name || hourly_rate === undefined) {
      return res.status(400).json({ success: false, message: 'Amenity Name and Hourly Rate are required' });
    }

    let organization_id = req.user.organization_id;
    if (req.user.roles.includes('Super Administrator') && req.body.organizationId) {
      organization_id = req.body.organizationId;
    }

    const transaction = await sequelize.transaction();
    try {
      const amenity = await Amenity.create({
        organization_id,
        name,
        description,
        capacity,
        hourly_rate,
        opening_time: opening_time || '08:00:00',
        closing_time: closing_time || '22:00:00',
        booking_rules,
        created_by: req.user.id,
        updated_by: req.user.id,
        is_active: true
      }, { transaction });

      if (propertyIds && Array.isArray(propertyIds) && propertyIds.length > 0) {
        const links = propertyIds.map(propId => ({
          property_id: propId,
          amenity_id: amenity.id,
          organization_id,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }));
        await PropertyAmenity.bulkCreate(links, { transaction });
      }

      await transaction.commit();

      await logAudit({
        action: 'CREATE_AMENITY',
        tableName: 'amenities',
        recordId: amenity.id,
        newValues: { ...amenity.toJSON(), propertyIds },
        req
      });

      return res.status(201).json({
        success: true,
        message: 'Amenity created successfully',
        data: amenity
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

const updateAmenity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, capacity, hourly_rate, opening_time, closing_time, booking_rules, propertyIds } = req.body;

    const whereClause = { id, is_active: true };
    if (!req.user.roles.includes('Super Administrator')) {
      whereClause.organization_id = req.user.organization_id;
    }

    const amenity = await Amenity.findOne({ where: whereClause });
    if (!amenity) {
      return res.status(404).json({ success: false, message: 'Amenity not found' });
    }

    const oldValues = amenity.toJSON();
    const transaction = await sequelize.transaction();

    try {
      amenity.name = name !== undefined ? name : amenity.name;
      amenity.description = description !== undefined ? description : amenity.description;
      amenity.capacity = capacity !== undefined ? capacity : amenity.capacity;
      amenity.hourly_rate = hourly_rate !== undefined ? hourly_rate : amenity.hourly_rate;
      amenity.opening_time = opening_time !== undefined ? opening_time : amenity.opening_time;
      amenity.closing_time = closing_time !== undefined ? closing_time : amenity.closing_time;
      amenity.booking_rules = booking_rules !== undefined ? booking_rules : amenity.booking_rules;
      amenity.updated_by = req.user.id;

      await amenity.save({ transaction });

      if (propertyIds && Array.isArray(propertyIds)) {
        await PropertyAmenity.destroy({ where: { amenity_id: id } }, { transaction });

        if (propertyIds.length > 0) {
          const links = propertyIds.map(propId => ({
            property_id: propId,
            amenity_id: id,
            organization_id: amenity.organization_id,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          }));
          await PropertyAmenity.bulkCreate(links, { transaction });
        }
      }

      await transaction.commit();

      await logAudit({
        action: 'UPDATE_AMENITY',
        tableName: 'amenities',
        recordId: amenity.id,
        oldValues,
        newValues: { ...amenity.toJSON(), propertyIds },
        req
      });

      return res.json({
        success: true,
        message: 'Amenity updated successfully',
        data: amenity
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

const deleteAmenity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const whereClause = { id, is_active: true };

    if (!req.user.roles.includes('Super Administrator')) {
      whereClause.organization_id = req.user.organization_id;
    }

    const amenity = await Amenity.findOne({ where: whereClause });
    if (!amenity) {
      return res.status(404).json({ success: false, message: 'Amenity not found' });
    }

    amenity.is_active = false;
    amenity.updated_by = req.user.id;
    await amenity.save();

    await logAudit({
      action: 'DELETE_AMENITY',
      tableName: 'amenities',
      recordId: amenity.id,
      oldValues: { id, name: amenity.name, is_active: true },
      newValues: { id, name: amenity.name, is_active: false },
      req
    });

    return res.json({
      success: true,
      message: 'Amenity deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const assignAmenityToProperties = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { propertyIds } = req.body;

    if (!propertyIds || !Array.isArray(propertyIds)) {
      return res.status(400).json({ success: false, message: 'propertyIds list is required' });
    }

    const whereClause = { id, is_active: true };
    if (!req.user.roles.includes('Super Administrator')) {
      whereClause.organization_id = req.user.organization_id;
    }

    const amenity = await Amenity.findOne({ where: whereClause });
    if (!amenity) {
      return res.status(404).json({ success: false, message: 'Amenity not found' });
    }

    const transaction = await sequelize.transaction();
    try {
      await PropertyAmenity.destroy({ where: { amenity_id: id } }, { transaction });

      const links = propertyIds.map(propId => ({
        property_id: propId,
        amenity_id: id,
        organization_id: amenity.organization_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }));

      await PropertyAmenity.bulkCreate(links, { transaction });
      await transaction.commit();

      await logAudit({
        action: 'ASSIGN_AMENITY_TO_PROPERTIES',
        tableName: 'property_amenities',
        recordId: id,
        newValues: { propertyIds },
        req
      });

      return res.json({
        success: true,
        message: 'Amenity assigned to properties successfully'
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAmenities,
  getAmenityById,
  createAmenity,
  updateAmenity,
  deleteAmenity,
  assignAmenityToProperties
};
