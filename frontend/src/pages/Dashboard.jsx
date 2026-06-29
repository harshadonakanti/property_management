import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Grid, Card, CardContent, Typography, Box, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Alert, Button, Avatar, Chip
} from '@mui/material';
import {
  Business, SportsTennis, CalendarToday, Receipt, AttachMoney, People, History, CorporateFare
} from '@mui/icons-material';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/stats');
        if (res.data.success) {
          setData(res.data.data);
        } else {
          setError(res.data.message || 'Failed to fetch dashboard statistics.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error connecting to statistics server.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!data) {
    return <Alert severity="info">No dashboard statistics available.</Alert>;
  }

  // 1. Super Administrator View
  if (data.role === 'Super Administrator') {
    const { stats, recentLogs } = data;
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 800 }}>
          Super Administrator Console
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { title: 'Organizations', value: stats.organizations, icon: <CorporateFare />, gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
            { title: 'Active Users', value: stats.activeUsers, icon: <People />, gradient: 'linear-gradient(135deg, #10b981, #047857)' },
            { title: 'Total Properties', value: stats.properties, icon: <Business />, gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
            { title: 'Amenities', value: stats.amenities, icon: <SportsTennis />, gradient: 'linear-gradient(135deg, #ec4899, #be185d)' },
            { title: 'Bookings', value: stats.bookings, icon: <CalendarToday />, gradient: 'linear-gradient(135deg, #f59e0b, #b45309)' },
            { title: 'System Revenue', value: `$${parseFloat(stats.revenue).toLocaleString()}`, icon: <AttachMoney />, gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }
          ].map((card, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ background: card.gradient, position: 'relative', overflow: 'hidden' }}>
                <CardContent sx={{ color: 'white', p: 3 }}>
                  <Box display="flex" justifyItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle2" sx={{ opacity: 0.8, fontWeight: 700 }}>
                        {card.title}
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>
                        {card.value}
                      </Typography>
                    </Box>
                    <Box sx={{
                      bgcolor: 'rgba(255,255,255,0.15)',
                      p: 1.5,
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 50,
                      width: 50
                    }}>
                      {card.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
          Recent System Logs (Audit Trail)
        </Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Table Affected</TableCell>
                <TableCell>IP Address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentLogs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                  <TableCell>{log.user ? log.user.email : 'System/Anonymous'}</TableCell>
                  <TableCell>
                    <Chip label={log.action} color={
                      log.action.includes('DELETE') ? 'error' :
                      log.action.includes('UPDATE') ? 'warning' : 'success'
                    } size="small" />
                  </TableCell>
                  <TableCell>{log.table_name}</TableCell>
                  <TableCell>{log.ip_address || 'N/A'}</TableCell>
                </TableRow>
              ))}
              {recentLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">No audit logs logged yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  // 2. Property Manager View
  if (data.role === 'Property Manager') {
    const { stats, calendar } = data;
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 800 }}>
          Property Manager Dashboard
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { title: 'Properties Managed', value: stats.properties, icon: <Business />, gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
            { title: 'Active Amenities', value: stats.amenities, icon: <SportsTennis />, gradient: 'linear-gradient(135deg, #ec4899, #be185d)' },
            { title: "Today's Bookings", value: stats.todayBookings, icon: <CalendarToday />, gradient: 'linear-gradient(135deg, #10b981, #047857)' },
            { title: 'Upcoming Bookings', value: stats.upcomingBookings, icon: <CalendarToday />, gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
            { title: 'Pending Approval', value: stats.pendingBookings, icon: <History />, gradient: 'linear-gradient(135deg, #f59e0b, #b45309)' }
          ].map((card, index) => (
            <Grid item xs={12} sm={6} md={2.4} key={index}>
              <Card sx={{ background: card.gradient, position: 'relative', overflow: 'hidden' }}>
                <CardContent sx={{ color: 'white', p: 3 }}>
                  <Box display="flex" justifyItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle2" sx={{ opacity: 0.8, fontSize: '0.75rem', fontWeight: 700 }}>
                        {card.title}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
                        {card.value}
                      </Typography>
                    </Box>
                    <Box sx={{
                      bgcolor: 'rgba(255,255,255,0.15)',
                      p: 1,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 40,
                      width: 40
                    }}>
                      {card.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
          Booking Agenda / Calendar Timeline
        </Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Booking Ref</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Amenity</TableCell>
                <TableCell>Property</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time Slot</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {calendar.map((booking) => (
                <TableRow key={booking.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{booking.booking_ref}</TableCell>
                  <TableCell>{booking.customer_name}</TableCell>
                  <TableCell>{booking.amenity.name}</TableCell>
                  <TableCell>{booking.property ? booking.property.name : 'N/A'}</TableCell>
                  <TableCell>{booking.booking_date}</TableCell>
                  <TableCell>{booking.start_time} - {booking.end_time}</TableCell>
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
                </TableRow>
              ))}
              {calendar.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">No bookings listed yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  // 3. Account Manager View
  if (data.role === 'Account Manager') {
    const { stats, bookingRevenue, paymentsHistory } = data;
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 800 }}>
          Billing Dashboard & Analytics
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { title: 'Total Revenue (Paid)', value: `$${parseFloat(stats.totalRevenue).toLocaleString()}`, icon: <AttachMoney />, gradient: 'linear-gradient(135deg, #10b981, #047857)' },
            { title: 'Pending Receivables', value: `$${parseFloat(stats.pendingPayments).toLocaleString()}`, icon: <Receipt />, gradient: 'linear-gradient(135deg, #f59e0b, #b45309)' },
            { title: 'Paid Invoices Count', value: stats.paidInvoices, icon: <Receipt />, gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)' }
          ].map((card, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <Card sx={{ background: card.gradient, position: 'relative', overflow: 'hidden' }}>
                <CardContent sx={{ color: 'white', p: 3 }}>
                  <Box display="flex" justifyItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle2" sx={{ opacity: 0.8, fontWeight: 700 }}>
                        {card.title}
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>
                        {card.value}
                      </Typography>
                    </Box>
                    <Box sx={{
                      bgcolor: 'rgba(255,255,255,0.15)',
                      p: 1.5,
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 50,
                      width: 50
                    }}>
                      {card.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
                Revenue split by Amenity
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                {bookingRevenue.map((rev, index) => {
                  const maxTotal = Math.max(...bookingRevenue.map(r => r.total), 1);
                  const percentage = (rev.total / maxTotal) * 100;
                  return (
                    <Box key={index}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" fontWeight={600}>{rev.amenityName}</Typography>
                        <Typography variant="body2" color="secondary" fontWeight={700}>${parseFloat(rev.total).toLocaleString()}</Typography>
                      </Box>
                      <Box sx={{ w: '100%', bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1, height: 8 }}>
                        <Box sx={{
                          width: `${percentage}%`,
                          background: 'linear-gradient(90deg, #6366f1, #ec4899)',
                          borderRadius: 1,
                          height: '100%'
                        }} />
                      </Box>
                    </Box>
                  );
                })}
                {bookingRevenue.length === 0 && (
                  <Typography variant="body2" color="text.secondary">No paid revenue transactions recorded.</Typography>
                )}
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Recent Billing Actions
              </Typography>
              <TableContainer sx={{ border: 'none' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Payment Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paymentsHistory.map((inv) => (
                      <TableRow key={inv.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{inv.invoice_number}</TableCell>
                        <TableCell>{inv.customer_name}</TableCell>
                        <TableCell>${parseFloat(inv.grand_total).toFixed(2)}</TableCell>
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
                      </TableRow>
                    ))}
                    {paymentsHistory.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No invoice history available.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return null;
};

export default Dashboard;
