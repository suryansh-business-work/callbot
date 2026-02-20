import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Contact, Company } from '../contacts.types';
import { fetchContacts, deleteContactApi, fetchCompanies } from '../contacts.api';
import ContactDialog from './ContactDialog';

const ContactsTab = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchContacts({
        page: page + 1, pageSize, search: search || undefined,
        companyId: companyFilter || undefined,
      });
      if (res.success) { setContacts(res.data); setTotal(res.pagination.total); }
    } catch { toast.error('Failed to load contacts'); }
    finally { setLoading(false); }
  }, [page, pageSize, search, companyFilter]);

  useEffect(() => { load(); }, [load]);

  // Load companies for filter dropdown
  useEffect(() => {
    fetchCompanies({ pageSize: 100 }).then((res) => {
      if (res.success) setCompanies(res.data);
    }).catch(() => {});
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this contact?')) return;
    try {
      await deleteContactApi(id);
      toast.success('Contact deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const handleCall = (phone: string) => {
    if (phone) navigate(`/call?phone=${encodeURIComponent(phone)}`);
  };

  const handleDialogClose = (saved?: boolean) => {
    setDialogOpen(false);
    setEditContact(null);
    if (saved) load();
  };

  return (
    <Box>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          size="small"
          sx={{ flex: 1, minWidth: 180 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <TextField
          select size="small" label="Company" value={companyFilter}
          onChange={(e) => { setCompanyFilter(e.target.value); setPage(0); }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All Companies</MenuItem>
          {companies.map((c) => (
            <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
          ))}
        </TextField>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Add Contact
        </Button>
      </Box>

      {/* Table */}
      <TableContainer>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : contacts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography color="text.secondary">No contacts yet</Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Tags</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contacts.map((c) => (
                <TableRow key={c._id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'primary.dark' }}>
                        {c.firstName.charAt(0)}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>
                        {c.firstName} {c.lastName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {c.companyId ? (
                      <Chip label={c.companyId.name} size="small" variant="outlined" />
                    ) : <Typography variant="body2" color="text.secondary">—</Typography>}
                  </TableCell>
                  <TableCell><Typography variant="body2">{c.phone || '—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{c.email || '—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{c.jobTitle || '—'}</Typography></TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {c.tags.slice(0, 3).map((t) => (
                        <Chip key={t} label={t} size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {c.phone && (
                      <Tooltip title="Call">
                        <IconButton size="small" color="primary" onClick={() => handleCall(c.phone)}>
                          <PhoneIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => { setEditContact(c); setDialogOpen(true); }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(c._id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <TablePagination
        component="div" count={total} page={page}
        onPageChange={(_, p) => setPage(p)} rowsPerPage={pageSize}
        onRowsPerPageChange={(e) => { setPageSize(+e.target.value); setPage(0); }}
        rowsPerPageOptions={[10, 20, 50]}
      />

      <ContactDialog open={dialogOpen} contact={editContact} companies={companies} onClose={handleDialogClose} />
    </Box>
  );
};

export default ContactsTab;
