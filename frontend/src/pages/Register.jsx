import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, Link, InputAdornment, IconButton } from '@mui/material';
import { Email, Lock, Business, Visibility, VisibilityOff } from '@mui/icons-material';

const Register = () => {
  const { registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    setError('');
    setSuccess('');
    const result = await registerUser(data.organizationId, data.email, data.password, data.confirmPassword);
    if (result.success) {
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(result.message);
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
          <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
              Register
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create a new Tenant Organization
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              label="Organization ID/Code"
              placeholder="e.g. ORG001"
              margin="normal"
              {...register('organizationId', { required: 'Organization ID/Code is required' })}
              error={!!errors.organizationId}
              helperText={errors.organizationId?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Business sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />

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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              margin="normal"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' }
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
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
              }}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              margin="normal"
              {...register('confirmPassword', {
                required: 'Confirm Password is required',
                validate: (val) => {
                  if (watch('password') !== val) {
                    return 'Passwords do not match';
                  }
                }
              })}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
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
              {isSubmitting ? 'Registering...' : 'Register'}
            </Button>
          </form>

          <Box mt={3} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" color="primary" sx={{ fontWeight: 600, textDecoration: 'none' }}>
                Sign In
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Register;
