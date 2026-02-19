import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import toast from 'react-hot-toast';
import { fetchPrompts, deletePromptApi } from '../promptlibrary.api';
import { PromptTemplate } from '../promptlibrary.types';

interface PromptLibraryTableProps {
  onEdit: (item: PromptTemplate) => void;
  refreshKey: number;
}

const PromptLibraryTable = ({ onEdit, refreshKey }: PromptLibraryTableProps) => {
  const [data, setData] = useState<PromptTemplate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchPrompts({ page: page + 1, pageSize, search: search || undefined });
      if (res.success) {
        setData(res.data);
        setTotal(res.pagination.total);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [page, pageSize, search, refreshKey]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this prompt?')) return;
    try {
      await deletePromptApi(id);
      toast.success('Prompt deleted');
      loadData();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <Box>
      <TextField
        placeholder="Search prompts..."
        size="small"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
        }}
        sx={{ mb: 2, width: { xs: '100%', sm: 300 } }}
      />
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>First Message</TableCell>
              <TableCell>Language</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">No prompts found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                    {item.tags.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                        {item.tags.map((t) => <Chip key={t} label={t} size="small" sx={{ height: 18, fontSize: '0.6rem' }} />)}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={item.systemPrompt.slice(0, 200)}>
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
                        {item.description || item.systemPrompt.slice(0, 80) + '...'}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                      {item.firstMessage || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>{item.language}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => onEdit(item)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(item._id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page}
        rowsPerPage={pageSize}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[5, 10, 20]}
      />
    </Box>
  );
};

export default PromptLibraryTable;
