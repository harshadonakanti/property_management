import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, Link, InputAdornment, IconButton } from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    setError('');
    try {
      const result = await login(data.email, data.password);
      if (result && result.success) {
        navigate('/dashboard');
      } else {
        setError(result?.message || 'Invalid email or password');
      }
    } catch (err) {
      setError('Login failed. Please check server connection.');
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.08), transparent 45%), radial-gradient(circle at bottom left, rgba(236, 72, 153, 0.08), transparent 45%), #f8fafc',
      p: 2
    }}>
      <Card sx={{ maxWidth: 450, width: '100%', border: '1px solid rgba(99, 102, 241, 0.12)' }}>
        <Box sx={{ height: 6, background: 'linear-gradient(90deg, #6366f1, #ec4899)' }} />
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
              HouseStays
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Property & Amenity Management System
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              label="Email Address"
              margin="normal"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' }
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              margin="normal"
              {...register('password', { required: 'Password is required' })}
              error={!!errors.password}
              helperText={errors.password?.message}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }
              }}
            />

            <Button
              fullWidth
              size="large"
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              sx={{
                mt: 4,
                py: 1.5,
                background: 'linear-gradient(45deg, #6366f1 30%, #ec4899 90%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(45deg, #4f46e5 30%, #db2777 90%)',
                }
              }}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Link component={RouterLink} to="/register" color="primary" sx={{ fontWeight: 600, textDecoration: 'none' }}>
                Register Organization
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
