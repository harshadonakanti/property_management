import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Typography, Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Alert, Chip, Pagination, Button, TextField, MenuItem, Select,
  FormControl, InputLabel, IconButton, Menu, ListItemIcon, ListItemText, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid
} from '@mui/material';
import {
  Refresh, People, Add, MoreVert, Edit, VpnKey, Block, ToggleOn, ToggleOff, Delete
} from '@mui/icons-material';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Selected employee for menus/actions
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  // Modal States
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openResetModal, setOpenResetModal] = useState(false);
  const [openRevokeDialog, setOpenRevokeDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    password: '',
    roleId: '',
    status: 'Active'
  });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Fetch Roles
  const fetchRoles = async () => {
    try {
      const res = await api.get('/employees/roles');
      if (res.data.success) {
        setRoles(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  // Fetch Employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/employees', {
        params: {
          page,
          limit,
          search,
          status: filterStatus,
          roleId: filterRole
        }
      });
      if (res.data.success) {
        setEmployees(res.data.data.employees);
        setTotalPages(res.data.data.pagination.totalPages);
      } else {
        setError(res.data.message || 'Failed to fetch employees.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading employees.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [page, filterRole, filterStatus]);

  // Handle Search Input Change (with basic debouncing helper or refresh manually)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEmployees();
  };

  // Action Menu Handlers
  const handleMenuOpen = (event, emp) => {
    setSelectedEmp(emp);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const openActionModal = (type) => {
    handleMenuClose();
    if (type === 'edit') {
      setFormData({
        firstName: selectedEmp.first_name || '',
        lastName: selectedEmp.last_name || '',
        email: selectedEmp.email || '',
        mobileNumber: selectedEmp.mobile_number || '',
        roleId: selectedEmp.role_id || '',
        status: selectedEmp.status || 'Active'
      });
      setOpenEditModal(true);
    } else if (type === 'reset') {
      setNewPassword('');
      setConfirmPassword('');
      setOpenResetModal(true);
    } else if (type === 'revoke') {
      setOpenRevokeDialog(true);
    } else if (type === 'delete') {
      setOpenDeleteDialog(true);
    }
  };

  // Create Employee Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const res = await api.post('/employees', formData);
      if (res.data.success) {
        setSuccess('Employee created successfully.');
        setOpenAddModal(false);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          mobileNumber: '',
          password: '',
          roleId: '',
          status: 'Active'
        });
        fetchEmployees();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create employee.');
    }
  };

  // Edit Employee Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const res = await api.put(`/employees/${selectedEmp.id}`, formData);
      if (res.data.success) {
        setSuccess('Employee details updated successfully.');
        setOpenEditModal(false);
        fetchEmployees();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update employee.');
    }
  };

  // Quick Status Toggle
  const handleStatusToggle = async (emp) => {
    try {
      setError('');
      setSuccess('');
      const nextStatus = emp.status === 'Active' ? 'Inactive' : 'Active';
      const res = await api.put(`/employees/${emp.id}`, { status: nextStatus });
      if (res.data.success) {
        setSuccess(`Employee ${nextStatus === 'Active' ? 'activated' : 'deactivated'} successfully.`);
        fetchEmployees();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change employee status.');
    }
  };

  // Reset Password Submit
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      setError('');
      setSuccess('');
      const res = await api.post(`/employees/${selectedEmp.id}/reset-password`, { password: newPassword });
      if (res.data.success) {
        setSuccess('Password updated successfully.');
        setOpenResetModal(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  // Revoke Login Access Confirm
  const handleRevokeConfirm = async () => {
    try {
      setError('');
      setSuccess('');
      const res = await api.post(`/employees/${selectedEmp.id}/revoke`);
      if (res.data.success) {
        setSuccess('Employee login access permanently revoked.');
        setOpenRevokeDialog(false);
        fetchEmployees();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to revoke employee access.');
    }
  };

  // Delete Employee Confirm
  const handleDeleteConfirm = async () => {
    try {
      setError('');
      setSuccess('');
      const res = await api.delete(`/employees/${selectedEmp.id}`);
      if (res.data.success) {
        setSuccess('Employee account soft-deleted successfully.');
        setOpenDeleteDialog(false);
        fetchEmployees();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete employee.');
    }
  };

  // Helpers to get Role badge color & label
  const getRoleLabel = (emp) => {
    return emp.role?.name || 'No Role';
  };

  const getStatusColor = (status, isRevoked) => {
    if (isRevoked) return 'error'; // revoked
    if (status === 'Active') return 'success';
    return 'default'; // inactive
  };

  return (
    <Box>
      {/* Title & Add Button */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <People color="primary" sx={{ fontSize: 36 }} />
          <Typography variant="h4" fontWeight={800}>
            Employee Directory
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchEmployees}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenAddModal(true)}>
            Add Employee
          </Button>
        </Box>
      </Box>

      {/* Success/Error Alerts */}
      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Search & Filter Card */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 4 }}>
        <form onSubmit={handleSearchSubmit}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label="Search employees by name, email, or mobile..."
                variant="outlined"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Role</InputLabel>
                <Select
                  value={filterRole}
                  label="Filter by Role"
                  onChange={(e) => {
                    setFilterRole(e.target.value);
                    setPage(1);
                  }}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  {roles.map((r) => (
                    <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Filter by Status"
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setPage(1);
                  }}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button type="submit" fullWidth variant="contained" color="secondary">
                Search
              </Button>
            </Grid>
          </Grid>
        </form>
      </Card>

      {/* Employees Table */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Mobile Number</TableCell>
                <TableCell>Designated Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Joined On</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {emp.first_name || emp.last_name
                      ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{emp.email}</TableCell>
                  <TableCell>{emp.mobile_number || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={getRoleLabel(emp)}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={emp.is_revoked ? 'Revoked' : emp.status}
                      size="small"
                      color={getStatusColor(emp.status, emp.is_revoked)}
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                    {new Date(emp.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, emp)}>
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {employees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No employees found matching the criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} color="primary" />
        </Box>
      )}

      {/* Context Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => openActionModal('edit')}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Edit Details</ListItemText>
        </MenuItem>

        {selectedEmp && (
          <MenuItem onClick={() => { handleMenuClose(); handleStatusToggle(selectedEmp); }}>
            <ListItemIcon>
              {selectedEmp.status === 'Active' ? <ToggleOff fontSize="small" /> : <ToggleOn fontSize="small" />}
            </ListItemIcon>
            <ListItemText>{selectedEmp.status === 'Active' ? 'Deactivate' : 'Activate'}</ListItemText>
          </MenuItem>
        )}

        <MenuItem onClick={() => openActionModal('reset')}>
          <ListItemIcon><VpnKey fontSize="small" /></ListItemIcon>
          <ListItemText>Reset Password</ListItemText>
        </MenuItem>

        {selectedEmp && !selectedEmp.is_revoked && (
          <MenuItem onClick={() => openActionModal('revoke')} sx={{ color: 'error.main' }}>
            <ListItemIcon><Block fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>Revoke Access</ListItemText>
          </MenuItem>
        )}

        <MenuItem onClick={() => openActionModal('delete')} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Soft Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Modal: Add Employee */}
      <Dialog open={openAddModal} onClose={() => setOpenAddModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Employee</DialogTitle>
        <form onSubmit={handleAddSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email Address"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Mobile Number"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="Password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Designated Role</InputLabel>
                  <Select
                    value={formData.roleId}
                    label="Designated Role"
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  >
                    {roles.map((r) => (
                      <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Account Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Account Status"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenAddModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create Employee</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modal: Edit Employee */}
      <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Employee Details</DialogTitle>
        <form onSubmit={handleEditSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email Address"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Mobile Number"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Designated Role</InputLabel>
                  <Select
                    value={formData.roleId}
                    label="Designated Role"
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  >
                    {roles.map((r) => (
                      <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Account Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Account Status"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenEditModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save Changes</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modal: Reset Password */}
      <Dialog open={openResetModal} onClose={() => setOpenResetModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reset Password</DialogTitle>
        <form onSubmit={handleResetSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Resetting password for <strong>{selectedEmp?.email}</strong>.
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="New Password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="Confirm New Password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenResetModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="warning">Update Password</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog: Revoke Login Access Confirm */}
      <Dialog open={openRevokeDialog} onClose={() => setOpenRevokeDialog(false)}>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>Revoke Login Access?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1">
            Are you sure you want to permanently revoke login access for <strong>{selectedEmp?.first_name} {selectedEmp?.last_name} ({selectedEmp?.email})</strong>?
          </Typography>
          <Typography variant="body2" color="error.main" mt={2} fontWeight={600}>
            Warning: This action is permanent. The user will be logged out instantly and will not be able to log back in.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenRevokeDialog(false)}>Cancel</Button>
          <Button onClick={handleRevokeConfirm} variant="contained" color="error">Revoke Access</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Soft Delete Confirm */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>Soft Delete Employee?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1">
            Are you sure you want to soft delete the employee account for <strong>{selectedEmp?.first_name} {selectedEmp?.last_name} ({selectedEmp?.email})</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={2}>
            This employee will be marked as inactive and soft-deleted. They will disappear from the active directory but their history is preserved in audit logs.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">Soft Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Employees;
