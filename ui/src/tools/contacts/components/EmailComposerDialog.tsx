import { useRef } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SendIcon from '@mui/icons-material/Send';
import toast from 'react-hot-toast';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { sendEmailApi } from '../contacts.email.api';

interface EmailComposerDialogProps {
  open: boolean;
  onClose: () => void;
  prefillTo: string;
  contactName: string;
}

const validationSchema = Yup.object({
  to: Yup.string().email('Invalid email').required('Recipient is required'),
  cc: Yup.string(),
  bcc: Yup.string(),
  subject: Yup.string().required('Subject is required').max(500),
  body: Yup.string().required('Message body is required'),
});

const EmailComposerDialog = ({ open, onClose, prefillTo, contactName }: EmailComposerDialogProps) => {
  const showCcRef = useRef(false);
  const formik = useFormik({
    initialValues: { to: prefillTo, cc: '', bcc: '', subject: '', body: '' },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const html = `<div style="font-family:sans-serif;white-space:pre-wrap">${values.body}</div>`;
        await sendEmailApi({
          to: values.to,
          cc: values.cc || undefined,
          bcc: values.bcc || undefined,
          subject: values.subject,
          html,
        });
        toast.success('Email sent successfully');
        resetForm();
        onClose();
      } catch {
        toast.error('Failed to send email');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const toggleCc = () => { showCcRef.current = !showCcRef.current; formik.setFieldValue('_toggle', Date.now()); };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700 }}>
            Send Email to {contactName}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 0.5 }}>
          <TextField
            fullWidth size="small" label="To" name="to"
            value={formik.values.to} onChange={formik.handleChange}
            error={formik.touched.to && Boolean(formik.errors.to)}
            helperText={formik.touched.to && formik.errors.to}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" color="text.secondary">CC / BCC</Typography>
            <IconButton size="small" onClick={toggleCc}>
              {showCcRef.current ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Box>
          <Collapse in={showCcRef.current}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <TextField
                fullWidth size="small" label="CC" name="cc"
                value={formik.values.cc} onChange={formik.handleChange}
                placeholder="email1@example.com, email2@example.com"
              />
              <TextField
                fullWidth size="small" label="BCC" name="bcc"
                value={formik.values.bcc} onChange={formik.handleChange}
                placeholder="email@example.com"
              />
            </Box>
          </Collapse>

          <TextField
            fullWidth size="small" label="Subject" name="subject"
            value={formik.values.subject} onChange={formik.handleChange}
            error={formik.touched.subject && Boolean(formik.errors.subject)}
            helperText={formik.touched.subject && formik.errors.subject}
          />

          <TextField
            fullWidth multiline minRows={6} maxRows={12}
            label="Message" name="body"
            value={formik.values.body} onChange={formik.handleChange}
            error={formik.touched.body && Boolean(formik.errors.body)}
            helperText={formik.touched.body && formik.errors.body}
            placeholder="Type your message here..."
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={formik.isSubmitting}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={formik.isSubmitting ? <CircularProgress size={16} /> : <SendIcon />}
          onClick={() => formik.handleSubmit()}
          disabled={formik.isSubmitting}
        >
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailComposerDialog;
