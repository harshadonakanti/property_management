import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Typography, Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, IconButton,
  Alert, CircularProgress, Chip, Pagination, MenuItem, Grid, Divider
} from '@mui/material';
import { Download, Visibility, Search, Refresh, CreditCard } from '@mui/icons-material';

const Invoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(''); // Paid, Unpaid, Refunded, or ''
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [newPaymentStatus, setNewPaymentStatus] = useState('');

  const isBillingManager = user && user.roles.some(role => ['Super Administrator', 'Account Manager'].includes(role));

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/invoices', {
        params: { page, limit: 10, search, paymentStatus }
      });
      if (res.data.success) {
        setInvoices(res.data.data.invoices);
        setTotalPages(res.data.data.pagination.totalPages);
      } else {
        setError(res.data.message || 'Failed to fetch invoices.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, search, paymentStatus]);

  const handleOpenDetail = async (id) => {
    try {
      const res = await api.get(`/invoices/${id}`);
      if (res.data.success) {
        setSelectedInvoice(res.data.data);
        setOpenDetailDialog(true);
      } else {
        setError(res.data.message || 'Failed to fetch invoice details');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching invoice details');
    }
  };

  const handleOpenStatusUpdate = (invoice) => {
    setSelectedInvoice(invoice);
    setNewPaymentStatus(invoice.payment_status);
    setOpenStatusDialog(true);
  };

  const handleUpdatePaymentStatus = async () => {
    if (!selectedInvoice) return;
    try {
      setError('');
      setSuccess('');
      const res = await api.put(`/invoices/${selectedInvoice.id}/payment`, { paymentStatus: newPaymentStatus });
      if (res.data.success) {
        setSuccess(`Invoice payment status updated to ${newPaymentStatus} successfully.`);
        setOpenStatusDialog(false);
        fetchInvoices();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update payment status');
    }
  };

  const handleDownloadPdf = async (id, invoiceNumber) => {
    try {
      setError('');
      setSuccess('Generating PDF invoice download...');
      const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
      
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `invoice-${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setSuccess('Download complete!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to download invoice PDF.');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight={800}>
          Invoices & Billing
        </Typography>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchInvoices}>
          Refresh
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Card sx={{ mb: 4, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              placeholder="Search invoices by customer name..."
              size="small"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              InputProps={{
                startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              select
              label="Payment Status"
              size="small"
              value={paymentStatus}
              onChange={(e) => {
                setPaymentStatus(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="Paid">Paid</MenuItem>
              <MenuItem value="Unpaid">Unpaid</MenuItem>
              <MenuItem value="Refunded">Refunded</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Card>

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Booking Ref</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Billing Hours</TableCell>
                <TableCell>Grand Total</TableCell>
                <TableCell>Payment Status</TableCell>
                <TableCell>Created Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{inv.invoice_number}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{inv.booking?.booking_ref || 'N/A'}</TableCell>
                  <TableCell>{inv.customer_name}</TableCell>
                  <TableCell>{parseFloat(inv.quantity).toFixed(1)} hrs</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>${parseFloat(inv.grand_total).toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={inv.payment_status}
                      size="small"
                      color={
                        inv.payment_status === 'Paid' ? 'success' :
                        inv.payment_status === 'Unpaid' ? 'warning' : 'error'
                      }
                    />
                  </TableCell>
                  <TableCell>{new Date(inv.created_at).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" title="View Details" onClick={() => handleOpenDetail(inv.id)}>
                      <Visibility />
                    </IconButton>
                    <IconButton color="secondary" title="Download PDF" onClick={() => handleDownloadPdf(inv.id, inv.invoice_number)}>
                      <Download />
                    </IconButton>
                    {isBillingManager && (
                      <IconButton color="warning" title="Update Payment Status" onClick={() => handleOpenStatusUpdate(inv)}>
                        <CreditCard />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">No invoices found matching filters.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} color="primary" />
        </Box>
      )}

      {/* Invoice Detail Dialog */}
      <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Invoice Details: {selectedInvoice?.invoice_number}
        </DialogTitle>
        <DialogContent dividers>
          {selectedInvoice && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Billing To</Typography>
                  <Typography variant="body1" fontWeight={700}>{selectedInvoice.customer_name}</Typography>
                  {selectedInvoice.booking?.customer_email && (
                    <Typography variant="body2" color="text.secondary">{selectedInvoice.booking.customer_email}</Typography>
                  )}
                  {selectedInvoice.booking?.customer_mobile && (
                    <Typography variant="body2" color="text.secondary">{selectedInvoice.booking.customer_mobile}</Typography>
                  )}
                </Grid>
                <Grid item xs={6} align="right">
                  <Typography variant="caption" color="text.secondary">Organization</Typography>
                  <Typography variant="body1" fontWeight={700}>{selectedInvoice.organization?.name}</Typography>
                  <Typography variant="body2" color="text.secondary">Org Code: {selectedInvoice.organization?.org_code}</Typography>
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={700} color="primary" gutterBottom>
                    Line Items
                  </Typography>
                  <Box display="flex" justifyContent="space-between" my={1}>
                    <Box>
                      <Typography variant="body1" fontWeight={600}>{selectedInvoice.booking?.amenity?.name || 'Amenity booking'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Property: {selectedInvoice.booking?.property?.name || 'N/A'} ({selectedInvoice.booking?.property?.code || 'N/A'})
                      </Typography>
                    </Box>
                    <Box align="right">
                      <Typography variant="body2">${parseFloat(selectedInvoice.hourly_rate).toFixed(2)} / hr</Typography>
                      <Typography variant="body2" color="text.secondary">x {parseFloat(selectedInvoice.quantity).toFixed(1)} hrs</Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Booking Date:</strong> {selectedInvoice.booking?.booking_date}</Typography>
                  <Typography variant="body2"><strong>Time Slot:</strong> {selectedInvoice.booking?.start_time} - {selectedInvoice.booking?.end_time}</Typography>
                </Grid>
                <Grid item xs={6} align="right">
                  <Typography variant="h5" fontWeight={800} color="secondary">
                    Total: ${parseFloat(selectedInvoice.grand_total).toFixed(2)}
                  </Typography>
                  <Chip
                    label={selectedInvoice.payment_status}
                    size="small"
                    color={
                      selectedInvoice.payment_status === 'Paid' ? 'success' :
                      selectedInvoice.payment_status === 'Unpaid' ? 'warning' : 'error'
                    }
                    sx={{ mt: 1 }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          {selectedInvoice && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<Download />}
              onClick={() => {
                handleDownloadPdf(selectedInvoice.id, selectedInvoice.invoice_number);
                setOpenDetailDialog(false);
              }}
            >
              Download PDF Invoice
            </Button>
          )}
          <Button onClick={() => setOpenDetailDialog(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Status Edit Dialog */}
      <Dialog open={openStatusDialog} onClose={() => setOpenStatusDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Update Payment Status</DialogTitle>
        <DialogContent>
          <Box py={2}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Update payment status for invoice <strong>{selectedInvoice?.invoice_number}</strong>:
            </Typography>
            <TextField
              fullWidth
              select
              label="Payment Status"
              value={newPaymentStatus}
              onChange={(e) => setNewPaymentStatus(e.target.value)}
            >
              <MenuItem value="Unpaid">Unpaid</MenuItem>
              <MenuItem value="Paid">Paid</MenuItem>
              <MenuItem value="Refunded">Refunded</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenStatusDialog(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleUpdatePaymentStatus}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Invoices;
