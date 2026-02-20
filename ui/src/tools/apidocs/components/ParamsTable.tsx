import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import { ApiParam } from '../apidocs.constants';

interface ParamsTableProps {
  params: ApiParam[];
}

const ParamsTable = ({ params }: ParamsTableProps) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: '0.85rem' }}>
        Request Body
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Parameter</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Required</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Default</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {params.map((param) => (
              <TableRow key={param.name} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                <TableCell>
                  <Typography
                    component="code"
                    sx={{
                      fontSize: '0.78rem',
                      fontFamily: 'monospace',
                      bgcolor: 'action.hover',
                      px: 0.8,
                      py: 0.2,
                      borderRadius: 0.5,
                      fontWeight: 600,
                    }}
                  >
                    {param.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={param.type}
                    size="small"
                    sx={{ height: 20, fontSize: '0.68rem', fontFamily: 'monospace' }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={param.required ? 'Yes' : 'No'}
                    size="small"
                    color={param.required ? 'error' : 'default'}
                    variant={param.required ? 'filled' : 'outlined'}
                    sx={{ height: 20, fontSize: '0.68rem' }}
                  />
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: '0.73rem', fontFamily: 'monospace', color: 'text.secondary' }}>
                    {param.default || '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: '0.73rem', color: 'text.secondary' }}>
                    {param.description}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ParamsTable;
