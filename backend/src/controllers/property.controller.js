const { Property, Organization } = require('../models');
const { logAudit } = require('../utils/audit');
const { Op } = require('sequelize');

const getProperties = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { is_active: true };

    if (!req.user.roles.includes('Super Administrator')) {
      whereClause.organization_id = req.user.organization_id;
    } else if (req.query.organizationId) {
      whereClause.organization_id = req.query.organizationId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } },
        { city: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Property.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['name', 'org_code']
        }
      ]
    });

    return res.json({
      success: true,
      message: 'Properties retrieved successfully',
      data: {
        properties: rows,
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

const getPropertyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const whereClause = { id, is_active: true };

    if (!req.user.roles.includes('Super Administrator')) {
      whereClause.organization_id = req.user.organization_id;
    }

    const property = await Property.findOne({
      where: whereClause,
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['name', 'org_code']
        }
      ]
    });

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    return res.json({
      success: true,
      message: 'Property retrieved successfully',
      data: property
    });
  } catch (error) {
    next(error);
  }
};

const createProperty = async (req, res, next) => {
  try {
    const { name, code, address, city, state, country, postal_code, description, status, images } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Property Name and Code are required' });
    }

    let organization_id = req.user.organization_id;
    if (req.user.roles.includes('Super Administrator') && req.body.organizationId) {
      organization_id = req.body.organizationId;
    }

    const property = await Property.create({
      organization_id,
      name,
      code,
      address,
      city,
      state,
      country,
      postal_code,
      description,
      status: status || 'Active',
      images: images || [],
      created_by: req.user.id,
      updated_by: req.user.id,
      is_active: true
    });

    await logAudit({
      action: 'CREATE_PROPERTY',
      tableName: 'properties',
      recordId: property.id,
      newValues: property.toJSON(),
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: property
    });
  } catch (error) {
    next(error);
  }
};

const updateProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, address, city, state, country, postal_code, description, status, images } = req.body;

    const whereClause = { id, is_active: true };
    if (!req.user.roles.includes('Super Administrator')) {
      whereClause.organization_id = req.user.organization_id;
    }

    const property = await Property.findOne({ where: whereClause });
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const oldValues = property.toJSON();

    property.name = name !== undefined ? name : property.name;
    property.code = code !== undefined ? code : property.code;
    property.address = address !== undefined ? address : property.address;
    property.city = city !== undefined ? city : property.city;
    property.state = state !== undefined ? state : property.state;
    property.country = country !== undefined ? country : property.country;
    property.postal_code = postal_code !== undefined ? postal_code : property.postal_code;
    property.description = description !== undefined ? description : property.description;
    property.status = status !== undefined ? status : property.status;
    property.images = images !== undefined ? images : property.images;
    property.updated_by = req.user.id;

    await property.save();

    await logAudit({
      action: 'UPDATE_PROPERTY',
      tableName: 'properties',
      recordId: property.id,
      oldValues,
      newValues: property.toJSON(),
      req
    });

    return res.json({
      success: true,
      message: 'Property updated successfully',
      data: property
    });
  } catch (error) {
    next(error);
  }
};

const deleteProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const whereClause = { id, is_active: true };

    if (!req.user.roles.includes('Super Administrator')) {
      whereClause.organization_id = req.user.organization_id;
    }

    const property = await Property.findOne({ where: whereClause });
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    property.is_active = false;
    property.updated_by = req.user.id;
    await property.save();

    await logAudit({
      action: 'DELETE_PROPERTY',
      tableName: 'properties',
      recordId: property.id,
      oldValues: { id, name: property.name, is_active: true },
      newValues: { id, name: property.name, is_active: false },
      req
    });

    return res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty
};
