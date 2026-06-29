const { User, Role, UserRole, sequelize } = require('../models');
const { logAudit } = require('../utils/audit');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');

const getEmployees = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', roleId = '', sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      is_deleted: false,
      organization_id: req.user.organization_id
    };

    if (status) {
      whereClause.status = status;
    }

    if (roleId) {
      whereClause.role_id = roleId;
    }

    if (search) {
      whereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { mobile_number: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name']
        }
      ]
    });

    return res.json({
      success: true,
      message: 'Employees retrieved successfully',
      data: {
        employees: rows,
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

const getRoles = async (req, res, next) => {
  try {
    const roles = await Role.findAll({
      where: { is_active: true }
    });
    return res.json({
      success: true,
      message: 'Roles retrieved successfully',
      data: roles
    });
  } catch (error) {
    next(error);
  }
};

const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await User.findOne({
      where: {
        id,
        is_deleted: false,
        organization_id: req.user.organization_id
      },
      include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }]
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    return res.json({
      success: true,
      message: 'Employee retrieved successfully',
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

const createEmployee = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { firstName, lastName, email, mobileNumber, password, roleId, status = 'Active' } = req.body;

    if (!email || !password || !roleId) {
      return res.status(400).json({ success: false, message: 'Email, password, and role are required' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } }, { transaction });
    if (existingUser) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    // Check if role exists
    const role = await Role.findByPk(roleId, { transaction });
    if (!role) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Invalid role selected' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newEmployee = await User.create({
      organization_id: req.user.organization_id,
      email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      mobile_number: mobileNumber,
      status,
      is_active: status === 'Active',
      is_deleted: false,
      is_revoked: false,
      role_id: roleId,
      created_by: req.user.id,
      updated_by: req.user.id
    }, { transaction });

    // Sync in UserRole for compatibility
    await UserRole.create({
      user_id: newEmployee.id,
      role_id: roleId,
      organization_id: req.user.organization_id,
      is_active: status === 'Active',
      created_by: req.user.id,
      updated_by: req.user.id
    }, { transaction });

    await transaction.commit();

    await logAudit({
      action: 'CREATE_EMPLOYEE',
      tableName: 'users',
      recordId: newEmployee.id,
      newValues: {
        email,
        first_name: firstName,
        last_name: lastName,
        role: role.name,
        status
      },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: newEmployee
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { firstName, lastName, email, mobileNumber, roleId, status } = req.body;

    const employee = await User.findOne({
      where: {
        id,
        is_deleted: false,
        organization_id: req.user.organization_id
      }
    }, { transaction });

    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const oldValues = employee.toJSON();

    if (email && email !== employee.email) {
      const existingUser = await User.findOne({ where: { email, id: { [Op.ne]: id } } }, { transaction });
      if (existingUser) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Email is already in use by another user' });
      }
      employee.email = email;
    }

    if (firstName !== undefined) employee.first_name = firstName;
    if (lastName !== undefined) employee.last_name = lastName;
    if (mobileNumber !== undefined) employee.mobile_number = mobileNumber;

    if (status !== undefined) {
      employee.status = status;
      employee.is_active = status === 'Active';
    }

    if (roleId !== undefined && roleId !== employee.role_id) {
      const role = await Role.findByPk(roleId, { transaction });
      if (!role) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Invalid role selected' });
      }
      employee.role_id = roleId;

      await UserRole.destroy({ where: { user_id: id } }, { transaction });
      await UserRole.create({
        user_id: id,
        role_id: roleId,
        organization_id: req.user.organization_id,
        is_active: employee.is_active,
        created_by: req.user.id,
        updated_by: req.user.id
      }, { transaction });
    } else if (status !== undefined) {
      await UserRole.update(
        { is_active: employee.is_active, updated_by: req.user.id },
        { where: { user_id: id } },
        { transaction }
      );
    }

    employee.updated_by = req.user.id;
    await employee.save({ transaction });

    await transaction.commit();

    await logAudit({
      action: 'UPDATE_EMPLOYEE',
      tableName: 'users',
      recordId: employee.id,
      oldValues,
      newValues: employee.toJSON(),
      req
    });

    return res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'New password is required' });
    }

    const employee = await User.findOne({
      where: {
        id,
        is_deleted: false,
        organization_id: req.user.organization_id
      }
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    employee.password_hash = await bcrypt.hash(password, 10);
    employee.updated_by = req.user.id;
    await employee.save();

    await logAudit({
      action: 'RESET_EMPLOYEE_PASSWORD',
      tableName: 'users',
      recordId: employee.id,
      req
    });

    return res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    next(error);
  }
};

const revokeAccess = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const employee = await User.findOne({
      where: {
        id,
        is_deleted: false,
        organization_id: req.user.organization_id
      }
    }, { transaction });

    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const oldValues = employee.toJSON();

    employee.is_revoked = true;
    employee.status = 'Inactive';
    employee.is_active = false;
    employee.updated_by = req.user.id;
    await employee.save({ transaction });

    await UserRole.update(
      { is_active: false, updated_by: req.user.id },
      { where: { user_id: id } },
      { transaction }
    );

    await transaction.commit();

    await logAudit({
      action: 'REVOKE_EMPLOYEE_ACCESS',
      tableName: 'users',
      recordId: employee.id,
      oldValues,
      newValues: employee.toJSON(),
      req
    });

    return res.json({
      success: true,
      message: 'Employee login access revoked permanently'
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

const deleteEmployee = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    const employee = await User.findOne({
      where: {
        id,
        is_deleted: false,
        organization_id: req.user.organization_id
      }
    }, { transaction });

    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const oldValues = employee.toJSON();

    employee.is_deleted = true;
    employee.status = 'Inactive';
    employee.is_active = false;
    employee.updated_by = req.user.id;
    await employee.save({ transaction });

    await UserRole.update(
      { is_active: false, updated_by: req.user.id },
      { where: { user_id: id } },
      { transaction }
    );

    await transaction.commit();

    await logAudit({
      action: 'DELETE_EMPLOYEE',
      tableName: 'users',
      recordId: employee.id,
      oldValues,
      newValues: employee.toJSON(),
      req
    });

    return res.json({
      success: true,
      message: 'Employee deleted successfully (soft delete)'
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

module.exports = {
  getEmployees,
  getRoles,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  resetPassword,
  revokeAccess,
  deleteEmployee
};
