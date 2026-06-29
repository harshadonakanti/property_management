import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Typography, Box, Button, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, IconButton, Alert, CircularProgress, Chip, Pagination, Grid
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import { useForm } from 'react-hook-form';

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/properties`, {
        params: { page, limit: 10, search }
      });
      if (res.data.success) {
        setProperties(res.data.data.properties);
        setTotalPages(res.data.data.pagination.totalPages);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [page, search]);

  const handleOpenAdd = () => {
    setEditingProperty(null);
    reset({
      name: '',
      code: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      description: '',
      status: 'Active'
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (prop) => {
    setEditingProperty(prop);
    setOpenDialog(true);
    // Populate form fields
    setValue('name', prop.name);
    setValue('code', prop.code);
    setValue('address', prop.address);
    setValue('city', prop.city);
    setValue('state', prop.state);
    setValue('country', prop.country);
    setValue('postal_code', prop.postal_code);
    setValue('description', prop.description);
    setValue('status', prop.status);
  };

  const onSubmit = async (data) => {
    try {
      if (editingProperty) {
        await api.put(`/properties/${editingProperty.id}`, data);
      } else {
        await api.post('/properties', data);
      }
      setOpenDialog(false);
      fetchProperties();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving property');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await api.delete(`/properties/${id}`);
        fetchProperties();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete property');
      }
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight={800}>
          Properties
        </Typography>
        <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleOpenAdd}>
          Add Property
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <Card sx={{ mb: 4, p: 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            fullWidth
            placeholder="Search properties by name or code..."
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
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {properties.map((prop) => (
                <TableRow key={prop.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{prop.code}</TableCell>
                  <TableCell>{prop.name}</TableCell>
                  <TableCell>{[prop.city, prop.state, prop.country].filter(Boolean).join(', ') || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={prop.status}
                      size="small"
                      color={prop.status === 'Active' ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => handleOpenEdit(prop)}>
                      <Edit />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(prop.id)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {properties.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">No properties found.</TableCell>
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
        <DialogTitle sx={{ fontWeight: 700 }}>{editingProperty ? 'Edit Property' : 'Add Property'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Property Code"
                  {...register('code', { required: 'Code is required' })}
                  error={!!errors.code}
                  helperText={errors.code?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Property Name"
                  {...register('name', { required: 'Name is required' })}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  {...register('address')}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="City"
                  {...register('city')}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="State"
                  {...register('state')}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Country"
                  {...register('country')}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  {...register('postal_code')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  {...register('description')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  defaultValue="Active"
                  {...register('status')}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                </TextField>
              </Grid>
            </Grid>
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

export default Properties;
