import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import { useFormik } from 'formik';
import toast from 'react-hot-toast';
import { promptValidationSchema, PromptFormValues, promptInitialValues } from '../promptlibrary.validation';
import { createPromptApi, updatePromptApi } from '../promptlibrary.api';
import { PromptTemplate } from '../promptlibrary.types';
import { SUPPORTED_LANGUAGES } from '../../voices/voices.data';
import AiPromptGenerator from './AiPromptGenerator';

interface PromptFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editItem?: PromptTemplate | null;
}

const PromptFormDialog = ({ open, onClose, onSaved, editItem }: PromptFormDialogProps) => {
  const [loading, setLoading] = useState(false);

  const formik = useFormik<PromptFormValues>({
    initialValues: editItem
      ? { name: editItem.name, description: editItem.description, systemPrompt: editItem.systemPrompt, firstMessage: editItem.firstMessage || '', language: editItem.language, tags: editItem.tags }
      : promptInitialValues,
    enableReinitialize: true,
    validationSchema: promptValidationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        if (editItem) {
          const res = await updatePromptApi(editItem._id, values);
          if (res.success) { toast.success('Prompt updated'); onSaved(); onClose(); }
          else toast.error(res.message);
        } else {
          const res = await createPromptApi(values);
          if (res.success) { toast.success('Prompt created'); onSaved(); onClose(); }
          else toast.error(res.message);
        }
      } catch { toast.error('Failed to save prompt'); } finally { setLoading(false); }
    },
  });

  const handleAiGenerated = (data: { name: string; systemPrompt: string; description: string }) => {
    formik.setFieldValue('name', data.name);
    formik.setFieldValue('systemPrompt', data.systemPrompt);
    formik.setFieldValue('description', data.description);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{editItem ? 'Edit Prompt' : 'Create Prompt'}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {!editItem && (
            <AiPromptGenerator language={formik.values.language} onGenerated={handleAiGenerated} />
          )}
          <TextField fullWidth size="small" label="Name" name="name" value={formik.values.name}
            onChange={formik.handleChange} onBlur={formik.handleBlur}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && formik.errors.name} />
          <TextField fullWidth size="small" label="Description" name="description"
            value={formik.values.description} onChange={formik.handleChange}
            multiline rows={2} />
          <TextField fullWidth size="small" label="System Prompt" name="systemPrompt"
            value={formik.values.systemPrompt} onChange={formik.handleChange} onBlur={formik.handleBlur}
            error={formik.touched.systemPrompt && Boolean(formik.errors.systemPrompt)}
            helperText={formik.touched.systemPrompt && formik.errors.systemPrompt}
            multiline rows={6} />
          <TextField fullWidth size="small" label="First Message" name="firstMessage"
            value={formik.values.firstMessage} onChange={formik.handleChange}
            placeholder="Opening message the AI will speak first..."
            helperText="The AI will speak this message when the call connects"
            multiline rows={2} />
          <TextField select fullWidth size="small" label="Language" name="language"
            value={formik.values.language} onChange={formik.handleChange}>
            {SUPPORTED_LANGUAGES.map((l) => (
              <MenuItem key={l.code} value={l.code}>{l.flag} {l.label}</MenuItem>
            ))}
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => formik.handleSubmit()} disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}>
          {editItem ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PromptFormDialog;
