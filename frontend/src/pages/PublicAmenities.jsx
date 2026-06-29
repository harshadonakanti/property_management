import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Typography, Box, Card, CardContent, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Alert, CircularProgress, Grid, CardActions, Divider
} from '@mui/material';
import { SportsTennis, CalendarToday, People, AttachMoney, AccessTime, Business } from '@mui/icons-material';
import { useForm } from 'react-hook-form';

const PublicAmenities = () => {
  const [searchParams] = useSearchParams();
  const organizationID = searchParams.get('organizationID');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [orgData, setOrgData] = useState(null);
  
  const [selectedAmenity, setSelectedAmenity] = useState(null);
  const [openBookingDialog, setOpenBookingDialog] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchPublicAmenities = async () => {
    if (!organizationID) {
      setError('No Organization ID provided. Please access this page with a valid organizationID parameter (e.g. ?organizationID=ORG001)');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      // Using direct axios instance to avoid global interceptors redirecting on 401
      const res = await axios.get(`http://localhost:5000/api/public/amenities`, {
        params: { organizationID }
      });
      if (res.data.success) {
        setOrgData(res.data.data);
      } else {
        setError(res.data.message || 'Failed to fetch public amenities');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error connecting to servers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicAmenities();
  }, [organizationID]);

  const handleOpenBooking = (amenity) => {
    setSelectedAmenity(amenity);
    reset({
      propertyId: amenity.properties?.[0]?.id || '',
      bookingDate: new Date().toISOString().split('T')[0],
      startTime: amenity.opening_time ? amenity.opening_time.slice(0, 5) : '09:00',
      endTime: amenity.closing_time ? amenity.closing_time.slice(0, 5) : '10:00',
      guestsCount: 1,
      customerName: '',
      customerMobile: '',
      customerEmail: ''
    });
    setOpenBookingDialog(true);
  };

  const onSubmit = async (data) => {
    try {
      setBookingLoading(true);
      setError('');
      setSuccessMsg('');
      const res = await axios.post(`http://localhost:5000/api/public/bookings`, data, {
        params: { organizationID }
      });
      if (res.data.success) {
        const { bookingReference } = res.data.data;
        setSuccessMsg(`Booking request received! Your Booking Reference is: ${bookingReference}. The reservation is currently pending manager approval.`);
        setOpenBookingDialog(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting booking request. Please check slot availability.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#0f172a" color="white">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: '#f5f5f5',
      color: 'text.primary',
      p: { xs: 2, md: 4 }
    }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Box textAlign="center" mb={6}>
          <Typography variant="h3" sx={{
            fontWeight: 800,
            background: 'linear-gradient(45deg, #6366f1 30%, #ec4899 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}>
            {orgData?.organizationName || 'HouseStays Portal'}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Public Amenity Booking & Reservation Console
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 4 }} onClose={() => setError('')}>{error}</Alert>}
        {successMsg && <Alert severity="success" sx={{ mb: 4 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

        {orgData?.amenities && (
          <Grid container spacing={4}>
            {orgData.amenities.map((amenity) => (
              <Grid item xs={12} sm={6} md={4} key={amenity.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <SportsTennis color="primary" />
                      <Typography variant="h5" fontWeight={700}>
                        {amenity.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40, mb: 2 }}>
                      {amenity.description || 'No description provided.'}
                    </Typography>

                    <Divider sx={{ my: 2, opacity: 0.1 }} />

                    <Box display="flex" flexDirection="column" gap={1.5}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <AttachMoney fontSize="small" color="secondary" />
                        <Typography variant="body2">
                          <strong>Rate:</strong> ${parseFloat(amenity.hourly_rate).toFixed(2)} / hour
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <AccessTime fontSize="small" color="secondary" />
                        <Typography variant="body2">
                          <strong>Hours:</strong> {amenity.opening_time ? amenity.opening_time.slice(0, 5) : '08:00'} - {amenity.closing_time ? amenity.closing_time.slice(0, 5) : '22:00'}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <People fontSize="small" color="secondary" />
                        <Typography variant="body2">
                          <strong>Capacity:</strong> {amenity.capacity ? `${amenity.capacity} guests` : 'Unlimited'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handleOpenBooking(amenity)}
                      sx={{
                        background: 'linear-gradient(45deg, #6366f1 30%, #ec4899 90%)',
                        color: 'white'
                      }}
                    >
                      Book Reservation
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
            {orgData.amenities.length === 0 && (
              <Grid item xs={12} textAlign="center">
                <Typography color="text.secondary">No amenities are publicly available at this time.</Typography>
              </Grid>
            )}
          </Grid>
        )}

        {/* Booking Request Dialog */}
        <Dialog open={openBookingDialog} onClose={() => setOpenBookingDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 800 }}>
            Reserve: {selectedAmenity?.name}
          </DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogContent dividers>
              {selectedAmenity && (
                <Grid container spacing={2}>
                  {/* HIDDEN AMENITY ID */}
                  <input type="hidden" value={selectedAmenity.id} {...register('amenityId')} />

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      select
                      label="Select Property"
                      {...register('propertyId', selectedAmenity?.properties?.length ? { required: 'Please select a location/property' } : {})}
                      error={!!errors.propertyId}
                      helperText={errors.propertyId?.message}
                      InputProps={{
                        startAdornment: <Business sx={{ color: 'text.secondary', mr: 1 }} />
                      }}
                    >
                      {selectedAmenity.properties?.map(p => (
                        <MenuItem key={p.id} value={p.id}>{p.name} ({p.code})</MenuItem>
                      ))}
                      {(!selectedAmenity.properties || selectedAmenity.properties.length === 0) && (
                        <MenuItem value="">No properties assigned</MenuItem>
                      )}
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Reservation Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      {...register('bookingDate', { required: 'Date is required' })}
                      error={!!errors.bookingDate}
                      helperText={errors.bookingDate?.message}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Start Time"
                      type="time"
                      InputLabelProps={{ shrink: true }}
                      {...register('startTime', { required: 'Start time is required' })}
                      error={!!errors.startTime}
                      helperText={errors.startTime?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="End Time"
                      type="time"
                      InputLabelProps={{ shrink: true }}
                      {...register('endTime', { required: 'End time is required' })}
                      error={!!errors.endTime}
                      helperText={errors.endTime?.message}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Number of Guests"
                      type="number"
                      defaultValue={1}
                      {...register('guestsCount', { required: 'Guest count is required', min: 1 })}
                      error={!!errors.guestsCount}
                    />
                  </Grid>

                  <Grid item xs={12}><Divider sx={{ my: 1 }}>Contact Info</Divider></Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      placeholder="John Doe"
                      {...register('customerName', { required: 'Name is required' })}
                      error={!!errors.customerName}
                      helperText={errors.customerName?.message}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      placeholder="john@example.com"
                      {...register('customerEmail', {
                        required: 'Email is required',
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' }
                      })}
                      error={!!errors.customerEmail}
                      helperText={errors.customerEmail?.message}
                    />
                  </Grid>

<Grid item xs={12} sm={6}>
  <TextField
    fullWidth
    label="Mobile Number"
    placeholder="+1234567890"
    {...register('customerMobile', { required: 'Mobile is required' })}
    error={!!errors.customerMobile}
    helperText={errors.customerMobile?.message}
  />
</Grid>
                </Grid>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setOpenBookingDialog(false)}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={bookingLoading}
                sx={{
                  background: 'linear-gradient(45deg, #6366f1 30%, #ec4899 90%)',
                  color: 'white'
                }}
              >
                {bookingLoading ? 'Requesting...' : 'Request Booking'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </Box>
  );
};

export default PublicAmenities;
