import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Typography, Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Alert, Chip, Pagination, Button
} from '@mui/material';
import { Refresh, ListAlt } from '@mui/icons-material';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/audit', {
        params: { page, limit: 20 }
      });
      if (res.data.success) {
        setLogs(res.data.data.logs);
        setTotalPages(res.data.data.pagination.totalPages);
      } else {
        setError(res.data.message || 'Failed to fetch audit logs.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading audit logs. Make sure you are logged in as a Super Administrator.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box display="flex" alignItems="center" gap={1}>
          <ListAlt color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={800}>
            System Audit Trail
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchLogs}>
          Refresh Logs
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Organization</TableCell>
                <TableCell>Action Type</TableCell>
                <TableCell>Table Affected</TableCell>
                <TableCell>Record ID</TableCell>
                <TableCell>IP Address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {log.user ? log.user.email : 'System/Anonymous'}
                  </TableCell>
                  <TableCell>
                    {log.organization ? (
                      <Box>
                        <Typography variant="body2" fontWeight={500}>{log.organization.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{log.organization.org_code}</Typography>
                      </Box>
                    ) : 'System-Wide'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.action}
                      size="small"
                      color={
                        log.action.includes('DELETE') ? 'error' :
                        log.action.includes('UPDATE') || log.action.includes('REJECT') ? 'warning' : 'success'
                      }
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{log.table_name}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', opacity: 0.8 }}>
                    {log.record_id || 'N/A'}
                  </TableCell>
                  <TableCell>{log.ip_address || '127.0.0.1'}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">No audit logs recorded.</TableCell>
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
    </Box>
  );
};

export default AuditLogs;
