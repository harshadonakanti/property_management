import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Typography, Box, Button, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, Alert, CircularProgress, Chip, Pagination, FormGroup, FormControlLabel, Checkbox
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import { useForm } from 'react-hook-form';

const Amenities = () => {
  const [amenities, setAmenities] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState(null);
  const [selectedProperties, setSelectedProperties] = useState([]);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchAmenities = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/amenities`, {
        params: { page, limit: 10, search }
      });
      if (res.data.success) {
        setAmenities(res.data.data.amenities);
        setTotalPages(res.data.data.pagination.totalPages);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch amenities');
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await api.get('/properties', { params: { limit: 100 } });
      if (res.data.success) {
        setProperties(res.data.data.properties);
      }
    } catch (err) {
      console.error('Failed to fetch properties list', err);
    }
  };

  useEffect(() => {
    fetchAmenities();
    fetchProperties();
  }, [page, search]);

  const handleOpenAdd = () => {
    setEditingAmenity(null);
    setSelectedProperties([]);
    reset({
      name: '',
      description: '',
      capacity: '',
      hourly_rate: '',
      opening_time: '08:00',
      closing_time: '22:00',
      booking_rules: ''
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (amenity) => {
    setEditingAmenity(amenity);
    setOpenDialog(true);
    // Populate form fields
    setValue('name', amenity.name);
    setValue('description', amenity.description);
    setValue('capacity', amenity.capacity);
    setValue('hourly_rate', amenity.hourly_rate);
    setValue('opening_time', amenity.opening_time ? amenity.opening_time.slice(0, 5) : '08:00');
    setValue('closing_time', amenity.closing_time ? amenity.closing_time.slice(0, 5) : '22:00');
    setValue('booking_rules', amenity.booking_rules);
    setSelectedProperties(amenity.properties.map(p => p.id));
  };

  const handlePropertyToggle = (id) => {
    setSelectedProperties(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        propertyIds: selectedProperties
      };

      if (editingAmenity) {
        await api.put(`/amenities/${editingAmenity.id}`, payload);
      } else {
        await api.post('/amenities', payload);
      }
      setOpenDialog(false);
      fetchAmenities();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving amenity');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this amenity?')) {
      try {
        await api.delete(`/amenities/${id}`);
        fetchAmenities();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete amenity');
      }
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight={800}>
          Amenities
        </Typography>
        <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleOpenAdd}>
          Add Amenity
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <Card sx={{ mb: 4, p: 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            fullWidth
            placeholder="Search amenities by name..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
            }}
          />
        </Box>
      </Card>

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Hourly Rate</TableCell>
                <TableCell>Hours of Operation</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Assigned Properties</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {amenities.map((amenity) => (
                <TableRow key={amenity.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{amenity.name}</TableCell>
                  <TableCell>${parseFloat(amenity.hourly_rate).toFixed(2)} / hr</TableCell>
                  <TableCell>{amenity.opening_time ? amenity.opening_time.slice(0, 5) : '08:00'} - {amenity.closing_time ? amenity.closing_time.slice(0, 5) : '22:00'}</TableCell>
                  <TableCell>{amenity.capacity || 'Unlimited'}</TableCell>
                  <TableCell>
                    {amenity.properties.map(p => (
                      <Chip key={p.id} label={p.name} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                    {amenity.properties.length === 0 && (
                      <Typography variant="caption" color="text.secondary">None</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => handleOpenEdit(amenity)}>
                      <Edit />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(amenity.id)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {amenities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">No amenities found.</TableCell>
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

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editingAmenity ? 'Edit Amenity' : 'Add Amenity'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                fullWidth
                label="Amenity Name"
                {...register('name', { required: 'Name is required' })}
                error={!!errors.name}
                helperText={errors.name?.message}
              />
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                {...register('description')}
              />
              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  type="number"
                  label="Hourly Rate ($)"
                  {...register('hourly_rate', { required: 'Rate is required', min: 0 })}
                  error={!!errors.hourly_rate}
                  helperText={errors.hourly_rate?.message}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Capacity (Guests)"
                  {...register('capacity', { min: 0 })}
                />
              </Box>
              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  label="Opening Time"
                  type="time"
                  InputLabelProps={{ shrink: true }}
                  {...register('opening_time', { required: 'Opening time is required' })}
                />
                <TextField
                  fullWidth
                  label="Closing Time"
                  type="time"
                  InputLabelProps={{ shrink: true }}
                  {...register('closing_time', { required: 'Closing time is required' })}
                />
              </Box>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Booking Rules"
                {...register('booking_rules')}
              />

              <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 700 }}>
                Assign to Properties:
              </Typography>
              <FormGroup row>
                {properties.map(p => (
                  <FormControlLabel
                    key={p.id}
                    control={
                      <Checkbox
                        checked={selectedProperties.includes(p.id)}
                        onChange={() => handlePropertyToggle(p.id)}
                      />
                    }
                    label={p.name}
                  />
                ))}
                {properties.length === 0 && (
                  <Typography variant="caption" color="text.secondary">No properties available. Create a property first.</Typography>
                )}
              </FormGroup>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Amenities;
