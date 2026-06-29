import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box, Drawer, AppBar, Toolbar, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, IconButton, Button, Avatar, Menu, MenuItem, Divider
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, Business, SportsTennis, CalendarToday, Receipt, ListAlt, ExitToApp, Launch, People
} from '@mui/icons-material';

const drawerWidth = 240;

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', roles: ['Super Administrator', 'Property Manager', 'Account Manager'] },
    { text: 'Properties', icon: <Business />, path: '/properties', roles: ['Super Administrator', 'Property Manager'] },
    { text: 'Amenities', icon: <SportsTennis />, path: '/amenities', roles: ['Super Administrator', 'Property Manager'] },
    { text: 'Bookings', icon: <CalendarToday />, path: '/bookings', roles: ['Super Administrator', 'Property Manager', 'Account Manager'] },
    { text: 'Invoices', icon: <Receipt />, path: '/invoices', roles: ['Super Administrator', 'Account Manager'] },
    { text: 'Employees', icon: <People />, path: '/employees', roles: ['Super Administrator'] },
    { text: 'Audit Logs', icon: <ListAlt />, path: '/audit-logs', roles: ['Super Administrator'] }
  ];

  const filteredMenuItems = menuItems.filter(item => user.roles.some(r => item.roles.includes(r)));

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ justifyContent: 'center', py: 2 }}>
        <Typography variant="h5" sx={{
          fontWeight: 800,
          background: 'linear-gradient(45deg, #6366f1 30%, #ec4899 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: 1
        }}>
          HouseStays
        </Typography>
      </Toolbar>
      <Divider sx={{ opacity: 0.1 }} />
      <List sx={{ px: 2, flexGrow: 1 }}>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                borderRadius: 2,
                backgroundColor: location.pathname === item.path ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                color: location.pathname === item.path ? '#4f46e5' : '#64748b',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  color: '#0f172a'
                }
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ opacity: 0.1 }} />
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          color="secondary"
          startIcon={<Launch />}
          onClick={() => window.open(`/public/amenities?organizationID=${user.orgCode}`, '_blank')}
          sx={{ borderRadius: 2 }}
        >
          Public Page
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" sx={{ width: { md: `calc(100% - ${drawerWidth}px)` }, ml: { md: `${drawerWidth}px` } }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'text.primary' }}>
              {user.orgName}
            </Typography>
            <Typography variant="caption" sx={{ bgcolor: 'rgba(0, 0, 0, 0.06)', px: 1, py: 0.5, borderRadius: 1, color: 'text.secondary', fontWeight: 600 }}>
              {user.orgCode}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, color: 'text.secondary' }}>
              {user.email} ({user.roles[0]})
            </Typography>
            <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0 }}>
              <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 700 }}>
                {user.email.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem disabled>{user.email}</MenuItem>
              <MenuItem disabled>{user.roles.join(', ')}</MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon><ExitToApp fontSize="small" /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { md: `calc(100% - ${drawerWidth}px)` }, mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
