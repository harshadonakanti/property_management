const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const env = require('../config/env.config');
const { User, Role, Organization, UserRole, sequelize } = require('../models');
const { generateAccessToken, generateRefreshToken } = require('../helpers/jwt.helper');
const { logAudit } = require('../utils/audit');
const logger = require('../config/logger');

const register = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
    }

    const { organizationId, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } }, { transaction });
    if (existingUser) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    let org = await Organization.findOne({ where: { org_code: organizationId } }, { transaction });
    if (!org) {
      org = await Organization.create({
        org_code: organizationId,
        name: `${organizationId} Corp`
      }, { transaction });
    }

    const defaultRole = await Role.findOne({ where: { name: 'Property Manager' } }, { transaction });
    if (!defaultRole) {
      throw new Error('Default role "Property Manager" not found in DB');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      organization_id: org.id,
      email,
      password_hash: passwordHash,
      is_active: true
    }, { transaction });

    await UserRole.create({
      user_id: newUser.id,
      role_id: defaultRole.id,
      organization_id: org.id,
      is_active: true
    }, { transaction });

    await transaction.commit();

    await logAudit({
      action: 'REGISTER',
      tableName: 'users',
      recordId: newUser.id,
      newValues: { email, organization_id: org.id },
      req: { user: { id: newUser.id, organization_id: org.id } }
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful. You can now login.'
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Registration error: %o', error);
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({
      where: {
        email,
        is_active: true,
        status: 'Active',
        is_deleted: false,
        is_revoked: false
      },
      include: [
        {
          model: Role,
          as: 'roles',
          attributes: ['name']
        },
        {
          model: Organization,
          as: 'organization',
          attributes: ['org_code', 'name']
        }
      ]
    });

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const roles = user.roles.map(r => r.name);
    const accessToken = generateAccessToken(user, roles);
    const refreshToken = generateRefreshToken(user);

    req.user = { id: user.id, organization_id: user.organization_id };
    await logAudit({
      action: 'LOGIN',
      tableName: 'users',
      recordId: user.id,
      req
    });

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          organizationId: user.organization_id,
          orgCode: user.organization.org_code,
          orgName: user.organization.name,
          roles
        }
      }
    });
  } catch (error) {
    logger.error('Login error: %o', error);
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await logAudit({
        action: 'LOGOUT',
        tableName: 'users',
        recordId: req.user.id,
        req
      });
    }
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const decoded = jwt.verify(token, env.jwt.refreshSecret);
    const user = await User.findByPk(decoded.userId, {
      include: [{ model: Role, as: 'roles', attributes: ['name'] }]
    });

    if (!user || !user.is_active || user.status !== 'Active' || user.is_deleted || user.is_revoked) {
      return res.status(401).json({ success: false, message: 'User account not found, inactive, deleted, or revoked' });
    }

    const roles = user.roles.map(r => r.name);
    const accessToken = generateAccessToken(user, roles);

    return res.json({
      success: true,
      data: { accessToken }
    });
  } catch (error) {
    logger.error('Token refresh error: %o', error);
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Old and new passwords are required' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user || !(await bcrypt.compare(oldPassword, user.password_hash))) {
      return res.status(400).json({ success: false, message: 'Incorrect old password' });
    }

    user.password_hash = await bcrypt.hash(newPassword, 10);
    await user.save();

    await logAudit({
      action: 'CHANGE_PASSWORD',
      tableName: 'users',
      recordId: user.id,
      req
    });

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.json({ success: true, message: 'If email exists, a reset link will be logged' });
    }

    const resetToken = jwt.sign({ userId: user.id }, env.jwt.secret, { expiresIn: '1h' });
    logger.info(`FORGOT_PASSWORD: Password reset link for user ${email}: http://localhost:5173/reset-password?token=${resetToken}`);

    return res.json({
      success: true,
      message: 'Reset link generated successfully (logged to server console for testing).'
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    const decoded = jwt.verify(token, env.jwt.secret);
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.is_active || user.status !== 'Active' || user.is_deleted || user.is_revoked) {
      return res.status(400).json({ success: false, message: 'User not found, inactive, deleted, or revoked' });
    }

    user.password_hash = await bcrypt.hash(password, 10);
    await user.save();

    await logAudit({
      action: 'RESET_PASSWORD',
      tableName: 'users',
      recordId: user.id,
      req: { user: { id: user.id, organization_id: user.organization_id } }
    });

    return res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    logger.error('Password reset error: %o', error);
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword
};
