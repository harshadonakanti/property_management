const { Booking, Invoice, Amenity, Organization, Property, sequelize } = require('../models');
const { logAudit } = require('../utils/audit');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

const generateBookingRef = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'HSB-';
  for (let i = 0; i < 8; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
};

const generateInvoiceNum = () => {
  return 'INV-' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100);
};

const calculateHours = (startTimeStr, endTimeStr) => {
  const [sh, sm] = startTimeStr.split(':').map(Number);
  const [eh, em] = endTimeStr.split(':').map(Number);
  const startDec = sh + (sm || 0) / 60;
  const endDec = eh + (em || 0) / 60;
  return Math.max(0.5, Number((endDec - startDec).toFixed(2)));
};

const createPublicBooking = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { organizationID } = req.query;
    const { amenityId, propertyId, bookingDate, startTime, endTime, guestsCount, customerName, customerMobile, customerEmail } = req.body;

    if (!organizationID) {
      return res.status(400).json({ success: false, message: 'organizationID query parameter is required' });
    }

    if (!amenityId || !bookingDate || !startTime || !endTime || !customerName || !customerMobile || !customerEmail) {
      return res.status(400).json({ success: false, message: 'All booking fields are required' });
    }

    const org = await Organization.findOne({ where: { org_code: organizationID, is_active: true } }, { transaction });
    if (!org) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    const amenity = await Amenity.findOne({
      where: { id: amenityId, organization_id: org.id, is_active: true }
    }, { transaction });

    if (!amenity) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Amenity not found or does not belong to this organization' });
    }

    if (amenity.opening_time && startTime < amenity.opening_time) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: `Booking start time is before opening time (${amenity.opening_time})` });
    }
    if (amenity.closing_time && endTime > amenity.closing_time) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: `Booking end time is after closing time (${amenity.closing_time})` });
    }

    const overlappingBooking = await Booking.findOne({
      where: {
        amenity_id: amenityId,
        booking_date: bookingDate,
        status: { [Op.ne]: 'Rejected' },
        is_active: true,
        [Op.and]: [
          { start_time: { [Op.lt]: endTime } },
          { end_time: { [Op.gt]: startTime } }
        ]
      }
    }, { transaction });

    if (overlappingBooking) {
      await transaction.rollback();
      return res.status(409).json({ success: false, message: 'This time slot is already booked' });
    }

    const hours = calculateHours(startTime, endTime);
    const totalAmount = Number((hours * parseFloat(amenity.hourly_rate)).toFixed(2));

    const bookingRef = generateBookingRef();
    const booking = await Booking.create({
      organization_id: org.id,
      amenity_id: amenityId,
      property_id: propertyId || null,
      booking_ref: bookingRef,
      booking_date: bookingDate,
      start_time: startTime,
      end_time: endTime,
      guests_count: guestsCount || 1,
      customer_name: customerName,
      customer_mobile: customerMobile,
      customer_email: customerEmail,
      total_amount: totalAmount,
      status: 'Pending',
      is_active: true
    }, { transaction });

    const invoiceNum = generateInvoiceNum();
    const invoice = await Invoice.create({
      organization_id: org.id,
      booking_id: booking.id,
      invoice_number: invoiceNum,
      customer_name: customerName,
      hourly_rate: amenity.hourly_rate,
      quantity: hours,
      grand_total: totalAmount,
      payment_status: 'Unpaid',
      invoice_status: 'Sent',
      is_active: true
    }, { transaction });

    await transaction.commit();

    await logAudit({
      action: 'PUBLIC_BOOKING_CREATE',
      tableName: 'amenity_bookings',
      recordId: booking.id,
      newValues: { booking, invoice },
      req: { user: { id: null, organization_id: org.id } }
    });

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        bookingReference: bookingRef,
        booking,
        invoice
      }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

const getBookings = async (req, res, next) => {
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
        { customer_name: { [Op.iLike]: `%${search}%` } },
        { booking_ref: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Booking.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: Amenity,
          as: 'amenity',
          attributes: ['id', 'name', 'hourly_rate']
        },
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Organization,
          as: 'organization',
          attributes: ['name', 'org_code']
        }
      ]
    });

    return res.json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: {
        bookings: rows,
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

const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const whereClause = { id, is_active: true };

    if (!req.user.roles.includes('Super Administrator')) {
      whereClause.organization_id = req.user.organization_id;
    }

    const booking = await Booking.findOne({
      where: whereClause,
      include: [
        {
          model: Amenity,
          as: 'amenity',
          attributes: ['id', 'name', 'hourly_rate', 'description']
        },
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'name', 'code', 'address', 'city']
        },
        {
          model: Organization,
          as: 'organization',
          attributes: ['name', 'org_code']
        },
        {
          model: Invoice,
          as: 'invoice',
          attributes: ['id', 'invoice_number', 'payment_status', 'invoice_status', 'grand_total']
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    return res.json({
      success: true,
      message: 'Booking retrieved successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Approved or Rejected

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be Approved or Rejected.' });
    }

    const whereClause = { id, is_active: true };
    if (!req.user.roles.includes('Super Administrator')) {
      whereClause.organization_id = req.user.organization_id;
    }

    const booking = await Booking.findOne({ where: whereClause });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const oldValues = booking.toJSON();
    booking.status = status;
    booking.updated_by = req.user.id;
    await booking.save();

    await logAudit({
      action: `BOOKING_${status.toUpperCase()}`,
      tableName: 'amenity_bookings',
      recordId: booking.id,
      oldValues,
      newValues: booking.toJSON(),
      req
    });

    return res.json({
      success: true,
      message: `Booking status updated to ${status} successfully`,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPublicBooking,
  getBookings,
  getBookingById,
  updateBookingStatus
};
