const { Property, Amenity, Booking, Invoice, Organization, User, AuditLog, sequelize } = require('../models');
const { Op } = require('sequelize');

const getDashboardStats = async (req, res, next) => {
  try {
    const roles = req.user.roles;
    const organization_id = req.user.organization_id;

    if (roles.includes('Super Administrator')) {
      const totalOrgs = await Organization.count({ where: { is_active: true } });
      const totalUsers = await User.count({ where: { is_active: true, is_deleted: false, is_revoked: false } });
      const totalProperties = await Property.count({ where: { is_active: true } });
      const totalAmenities = await Amenity.count({ where: { is_active: true } });
      const totalBookings = await Booking.count({ where: { is_active: true } });
      
      const revenueData = await Invoice.findOne({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('grand_total')), 'totalRevenue']
        ],
        where: { payment_status: 'Paid', is_active: true }
      });
      const totalRevenue = parseFloat(revenueData.getDataValue('totalRevenue') || 0);

      const recentLogs = await AuditLog.findAll({
        limit: 10,
        order: [['created_at', 'DESC']],
        include: [{ model: User, as: 'user', attributes: ['email'] }]
      });

      return res.json({
        success: true,
        message: 'Super Administrator dashboard stats retrieved',
        data: {
          role: 'Super Administrator',
          stats: {
            organizations: totalOrgs,
            activeUsers: totalUsers,
            properties: totalProperties,
            amenities: totalAmenities,
            bookings: totalBookings,
            revenue: totalRevenue
          },
          recentLogs
        }
      });
    }

    if (roles.includes('Property Manager')) {
      const totalProperties = await Property.count({ where: { organization_id, is_active: true } });
      const totalAmenities = await Amenity.count({ where: { organization_id, is_active: true } });
      
      const today = new Date().toISOString().split('T')[0];

      const todayBookings = await Booking.count({
        where: { organization_id, booking_date: today, is_active: true }
      });

      const upcomingBookings = await Booking.count({
        where: {
          organization_id,
          booking_date: { [Op.gt]: today },
          is_active: true
        }
      });

      const pendingBookings = await Booking.count({
        where: { organization_id, status: 'Pending', is_active: true }
      });

      const bookings = await Booking.findAll({
        where: { organization_id, is_active: true },
        limit: 50,
        order: [['booking_date', 'ASC'], ['start_time', 'ASC']],
        include: [
          { model: Amenity, as: 'amenity', attributes: ['name'] },
          { model: Property, as: 'property', attributes: ['name'] }
        ]
      });

      return res.json({
        success: true,
        message: 'Property Manager dashboard stats retrieved',
        data: {
          role: 'Property Manager',
          stats: {
            properties: totalProperties,
            amenities: totalAmenities,
            todayBookings,
            upcomingBookings,
            pendingBookings
          },
          calendar: bookings
        }
      });
    }

    if (roles.includes('Account Manager')) {
      const revenueData = await Invoice.findOne({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('grand_total')), 'totalRevenue']
        ],
        where: { organization_id, payment_status: 'Paid', is_active: true }
      });
      const totalRevenue = parseFloat(revenueData.getDataValue('totalRevenue') || 0);

      const pendingData = await Invoice.findOne({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('grand_total')), 'pendingRevenue']
        ],
        where: { organization_id, payment_status: 'Unpaid', is_active: true }
      });
      const pendingPayments = parseFloat(pendingData.getDataValue('pendingRevenue') || 0);

      const paidInvoicesCount = await Invoice.count({
        where: { organization_id, payment_status: 'Paid', is_active: true }
      });

      const paidInvoices = await Invoice.findAll({
        where: { organization_id, payment_status: 'Paid', is_active: true },
        include: [{
          model: Booking,
          as: 'booking',
          include: [{
            model: Amenity,
            as: 'amenity',
            attributes: ['name']
          }]
        }]
      });

      const amenityMap = {};
      paidInvoices.forEach(inv => {
        const name = inv.booking && inv.booking.amenity ? inv.booking.amenity.name : 'Unknown';
        amenityMap[name] = (amenityMap[name] || 0) + parseFloat(inv.grand_total);
      });
      const bookingRevenue = Object.keys(amenityMap).map(key => ({
        amenityName: key,
        total: amenityMap[key]
      }));

      const paymentsHistory = await Invoice.findAll({
        where: { organization_id, is_active: true },
        limit: 10,
        order: [['updated_at', 'DESC']],
        include: [{ model: Booking, as: 'booking', attributes: ['booking_ref', 'booking_date'] }]
      });

      return res.json({
        success: true,
        message: 'Account Manager dashboard stats retrieved',
        data: {
          role: 'Account Manager',
          stats: {
            totalRevenue,
            pendingPayments,
            paidInvoices: paidInvoicesCount
          },
          bookingRevenue,
          paymentsHistory
        }
      });
    }

    return res.status(403).json({ success: false, message: 'Invalid role access for dashboard stats' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
