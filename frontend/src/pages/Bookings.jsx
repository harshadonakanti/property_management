import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Typography, Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, IconButton,
  Alert, CircularProgress, Chip, Pagination, MenuItem, Grid, Divider
} from '@mui/material';
import { Check, Close, Visibility, Search, Refresh } from '@mui/icons-material';

const Bookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(''); // Pending, Approved, Rejected, or ''
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);

  const isManagerOrAdmin = user && user.roles.some(role => ['Super Administrator', 'Property Manager'].includes(role));

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/bookings', {
        params: { page, limit: 10, search, status }
      });
      if (res.data.success) {
        setBookings(res.data.data.bookings);
        setTotalPages(res.data.data.pagination.totalPages);
      } else {
        setError(res.data.message || 'Failed to fetch bookings.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, search, status]);

  const handleUpdateStatus = async (id, newStatus) => {
    if (window.confirm(`Are you sure you want to change this booking status to ${newStatus}?`)) {
      try {
        setError('');
        setSuccess('');
        const res = await api.put(`/bookings/${id}/status`, { status: newStatus });
        if (res.data.success) {
          setSuccess(`Booking status updated to ${newStatus} successfully.`);
          fetchBookings();
          if (selectedBooking && selectedBooking.id === id) {
            handleOpenDetail(id); // reload detail if open
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || `Failed to update status to ${newStatus}`);
      }
    }
  };

  const handleOpenDetail = async (id) => {
    try {
      const res = await api.get(`/bookings/${id}`);
      if (res.data.success) {
        setSelectedBooking(res.data.data);
        setOpenDetailDialog(true);
      } else {
        setError(res.data.message || 'Failed to fetch booking details');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching booking details');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight={800}>
          Reservations & Bookings
        </Typography>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchBookings}>
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
              placeholder="Search bookings by customer name or reference..."
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
              label="Filter by Status"
              size="small"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
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
                <TableCell>Booking Ref</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Amenity</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time Slot</TableCell>
                <TableCell>Total Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{booking.booking_ref}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{booking.customer_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{booking.customer_email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{booking.amenity?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{booking.property?.name || 'N/A'}</Typography>
                  </TableCell>
                  <TableCell>{booking.booking_date}</TableCell>
                  <TableCell>{booking.start_time} - {booking.end_time}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>${parseFloat(booking.total_amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={booking.status}
                      size="small"
                      color={
                        booking.status === 'Approved' ? 'success' :
                        booking.status === 'Pending' ? 'warning' : 'error'
                      }
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" title="View Details" onClick={() => handleOpenDetail(booking.id)}>
                      <Visibility />
                    </IconButton>
                    {isManagerOrAdmin && booking.status === 'Pending' && (
                      <>
                        <IconButton color="success" title="Approve" onClick={() => handleUpdateStatus(booking.id, 'Approved')}>
                          <Check />
                        </IconButton>
                        <IconButton color="error" title="Reject" onClick={() => handleUpdateStatus(booking.id, 'Rejected')}>
                          <Close />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {bookings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">No bookings found matching filters.</TableCell>
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

      {/* Detail Dialog */}
      <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Booking Details: {selectedBooking?.booking_ref}
        </DialogTitle>
        <DialogContent dividers>
          {selectedBooking && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={700} color="primary" gutterBottom>
                    Customer Information
                  </Typography>
                  <Typography variant="body2"><strong>Name:</strong> {selectedBooking.customer_name}</Typography>
                  <Typography variant="body2"><strong>Email:</strong> {selectedBooking.customer_email}</Typography>
                  <Typography variant="body2"><strong>Phone:</strong> {selectedBooking.customer_mobile}</Typography>
                </Grid>
                
                <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={700} color="primary" gutterBottom>
                    Amenity Details
                  </Typography>
                  <Typography variant="body2"><strong>Amenity:</strong> {selectedBooking.amenity?.name}</Typography>
                  <Typography variant="body2"><strong>Property:</strong> {selectedBooking.property ? `${selectedBooking.property.name} (${selectedBooking.property.code})` : 'N/A'}</Typography>
                  {selectedBooking.property?.address && (
                    <Typography variant="body2"><strong>Address:</strong> {selectedBooking.property.address}, {selectedBooking.property.city}</Typography>
                  )}
                </Grid>

                <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={700} color="primary" gutterBottom>
                    Schedule & Rates
                  </Typography>
                  <Typography variant="body2"><strong>Date:</strong> {selectedBooking.booking_date}</Typography>
                  <Typography variant="body2"><strong>Time Slot:</strong> {selectedBooking.start_time} - {selectedBooking.end_time}</Typography>
                  <Typography variant="body2"><strong>Hourly Rate:</strong> ${parseFloat(selectedBooking.amenity?.hourly_rate || 0).toFixed(2)}/hr</Typography>
                  <Typography variant="body2"><strong>Guests Count:</strong> {selectedBooking.guests_count}</Typography>
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 700 }}>
                    Total Price: ${parseFloat(selectedBooking.total_amount).toFixed(2)}
                  </Typography>
                </Grid>

                <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={700} color="primary" gutterBottom>
                    Invoice & Status
                  </Typography>
                  <Typography variant="body2"><strong>Booking Status:</strong> {selectedBooking.status}</Typography>
                  {selectedBooking.invoice ? (
                    <>
                      <Typography variant="body2"><strong>Invoice Number:</strong> {selectedBooking.invoice.invoice_number}</Typography>
                      <Typography variant="body2"><strong>Invoice Total:</strong> ${parseFloat(selectedBooking.invoice.grand_total).toFixed(2)}</Typography>
                      <Typography variant="body2">
                        <strong>Payment Status:</strong>{' '}
                        <Chip
                          label={selectedBooking.invoice.payment_status}
                          size="small"
                          color={
                            selectedBooking.invoice.payment_status === 'Paid' ? 'success' :
                            selectedBooking.invoice.payment_status === 'Unpaid' ? 'warning' : 'error'
                          }
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No invoice generated.</Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          {isManagerOrAdmin && selectedBooking?.status === 'Pending' && (
            <>
              <Button variant="contained" color="success" onClick={() => { handleUpdateStatus(selectedBooking.id, 'Approved'); setOpenDetailDialog(false); }}>
                Approve Booking
              </Button>
              <Button variant="contained" color="error" onClick={() => { handleUpdateStatus(selectedBooking.id, 'Rejected'); setOpenDetailDialog(false); }}>
                Reject Booking
              </Button>
            </>
          )}
          <Button onClick={() => setOpenDetailDialog(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Bookings;
