const { Invoice, Booking, Amenity, Organization, Property } = require('../models');
const { logAudit } = require('../utils/audit');
const PDFDocument = require('pdfkit');

const getInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', paymentStatus = '', sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { is_active: true };

    if (!req.user.roles.includes('Super Administrator')) {
      whereClause.organization_id = req.user.organization_id;
    } else if (req.query.organizationId) {
      whereClause.organization_id = req.query.organizationId;
    }

    if (paymentStatus) {
      whereClause.payment_status = paymentStatus;
    }

    if (search) {
      whereClause.customer_name = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await Invoice.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: Booking,
          as: 'booking',
          attributes: ['booking_ref', 'booking_date', 'start_time', 'end_time'],
          include: [
            {
              model: Amenity,
              as: 'amenity',
              attributes: ['name']
            }
          ]
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
      message: 'Invoices retrieved successfully',
      data: {
        invoices: rows,
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

const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const whereClause = { id, is_active: true };

    if (!req.user.roles.includes('Super Administrator')) {
      whereClause.organization_id = req.user.organization_id;
    }

    const invoice = await Invoice.findOne({
      where: whereClause,
      include: [
        {
          model: Booking,
          as: 'booking',
          attributes: ['booking_ref', 'booking_date', 'start_time', 'end_time', 'customer_mobile', 'customer_email'],
          include: [
            {
              model: Amenity,
              as: 'amenity',
              attributes: ['name', 'description']
            },
            {
              model: Property,
              as: 'property',
              attributes: ['name', 'code']
            }
          ]
        },
        {
          model: Organization,
          as: 'organization',
          attributes: ['name', 'org_code']
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    return res.json({
      success: true,
      message: 'Invoice retrieved successfully',
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

const updatePaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!['Paid', 'Unpaid', 'Refunded'].includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status' });
    }

    const whereClause = { id, is_active: true };
    if (!req.user.roles.includes('Super Administrator')) {
      whereClause.organization_id = req.user.organization_id;
    }

    const invoice = await Invoice.findOne({ where: whereClause });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const oldValues = invoice.toJSON();
    invoice.payment_status = paymentStatus;
    invoice.updated_by = req.user.id;
    await invoice.save();

    await logAudit({
      action: `INVOICE_PAYMENT_${paymentStatus.toUpperCase()}`,
      tableName: 'invoices',
      recordId: invoice.id,
      oldValues,
      newValues: invoice.toJSON(),
      req
    });

    return res.json({
      success: true,
      message: `Invoice payment status updated to ${paymentStatus} successfully`,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

const exportInvoicePdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const whereClause = { id, is_active: true };

    if (!req.user.roles.includes('Super Administrator')) {
      whereClause.organization_id = req.user.organization_id;
    }

    const invoice = await Invoice.findOne({
      where: whereClause,
      include: [
        {
          model: Booking,
          as: 'booking',
          include: [
            {
              model: Amenity,
              as: 'amenity'
            },
            {
              model: Property,
              as: 'property'
            }
          ]
        },
        {
          model: Organization,
          as: 'organization'
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoice_number}.pdf`);

    doc.pipe(res);

    // Document header
    doc.fontSize(22).text('HouseStays Property Management', { align: 'center' });
    doc.fontSize(10).text('Enterprise Property & Amenity Management System', { align: 'center' });
    doc.moveDown(2);

    // Left Column: Org details
    doc.fontSize(12).text('FROM:', { underline: true });
    doc.fontSize(10).text(invoice.organization.name);
    doc.text(`Organization Code: ${invoice.organization.org_code}`);
    doc.moveDown();

    // Right Column (mock position by drawing on top)
    doc.fontSize(12).text('TO:', { underline: true });
    doc.fontSize(10).text(`Customer: ${invoice.customer_name}`);
    doc.text(`Email: ${invoice.booking.customer_email}`);
    doc.text(`Mobile: ${invoice.booking.customer_mobile}`);
    doc.moveDown(2);

    // Invoice Meta
    doc.fontSize(14).text(`INVOICE NUMBER: ${invoice.invoice_number}`, { bold: true });
    doc.fontSize(10).text(`Booking Reference: ${invoice.booking.booking_ref}`);
    doc.text(`Invoice Date: ${new Date(invoice.created_at).toLocaleDateString()}`);
    doc.text(`Payment Status: ${invoice.payment_status}`);
    doc.moveDown(2);

    // Itemized Details Table
    doc.fontSize(12).text('BILLING DESCRIPTION', { underline: true });
    doc.moveDown(0.5);
    
    const tableTop = doc.y;
    doc.fontSize(10).text('Amenity', 50, tableTop);
    doc.text('Property', 180, tableTop);
    doc.text('Rate ($/hr)', 300, tableTop);
    doc.text('Hours', 380, tableTop);
    doc.text('Total', 460, tableTop);
    
    doc.moveTo(50, tableTop + 15).lineTo(520, tableTop + 15).stroke();

    const rowY = tableTop + 25;
    doc.text(invoice.booking.amenity.name, 50, rowY);
    doc.text(invoice.booking.property ? invoice.booking.property.name : 'N/A', 180, rowY);
    doc.text(`$${parseFloat(invoice.hourly_rate).toFixed(2)}`, 300, rowY);
    doc.text(parseFloat(invoice.quantity).toFixed(2), 380, rowY);
    doc.text(`$${parseFloat(invoice.grand_total).toFixed(2)}`, 460, rowY);

    doc.moveTo(50, rowY + 15).lineTo(520, rowY + 15).stroke();
    doc.moveDown(3);

    // Summary block
    doc.fontSize(12).text(`GRAND TOTAL: $${parseFloat(invoice.grand_total).toFixed(2)}`, { align: 'right', bold: true });
    doc.moveDown(2);

    doc.fontSize(10).text('Thank you for booking with HouseStays!', { align: 'center', italic: true });

    doc.end();

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  updatePaymentStatus,
  exportInvoicePdf
};
