import { useCallback, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Backdrop from '@mui/material/Backdrop';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CallIcon from '@mui/icons-material/Call';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import TranslateIcon from '@mui/icons-material/Translate';
import { FormikProps } from 'formik';
import { getVoiceLabel, getVoiceLanguageCode, getVoicesByLanguage } from '../../voices/voices.data';
import VoiceSelector from '../../voices/VoiceSelector';
import { MakeCallFormValues } from '../calls.validation';
import { translateText } from '../calls.api';
import DialPad from './DialPad';
import LanguageSelect from './LanguageSelect';
import ContactAutocomplete from './ContactAutocomplete';
import AgentPromptSelect from './AgentPromptSelect';
import { PromptTemplate } from '../../promptlibrary/promptlibrary.types';
import { Contact } from '../../contacts/contacts.types';
import { useModel, AI_MODELS } from '../../../context/ModelContext';

interface DialerFormProps {
  formik: FormikProps<MakeCallFormValues>;
  loading: boolean;
  isCallActive: boolean;
  voiceDialogOpen: boolean;
  onVoiceDialogToggle: (open: boolean) => void;
}

const DialerForm = ({
  formik, loading, isCallActive,
  voiceDialogOpen, onVoiceDialogToggle,
}: DialerFormProps) => {
  const translatingRef = useRef(false);
  const [translating, setTranslating] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const { aiModel, setAiModel } = useModel();

  const runTranslation = useCallback(async (lang: string) => {
    if (translatingRef.current) return;
    translatingRef.current = true;
    setTranslating(true);
    try {
      const promises: Promise<void>[] = [];
      if (formik.values.message?.trim()) {
        promises.push(
          translateText({ text: formik.values.message, targetLanguage: lang })
            .then((res) => { if (res.success) formik.setFieldValue('message', res.data.translated); })
        );
      }
      if (formik.values.aiEnabled && formik.values.systemPrompt?.trim()) {
        promises.push(
          translateText({ text: formik.values.systemPrompt, targetLanguage: lang })
            .then((res) => { if (res.success) formik.setFieldValue('systemPrompt', res.data.translated); })
        );
      }
      await Promise.all(promises);
    } catch { /* non-critical */ } finally {
      translatingRef.current = false;
      setTranslating(false);
    }
  }, [formik]);

  const handleLanguageChange = useCallback(async (lang: string) => {
    const prevLang = formik.values.language;
    formik.setFieldValue('language', lang);

    const voices = getVoicesByLanguage(lang);
    if (voices.length > 0) {
      const currentVoiceLang = getVoiceLanguageCode(formik.values.voice);
      if (currentVoiceLang !== lang) {
        formik.setFieldValue('voice', voices[0].id);
      }
    }

    if (prevLang !== lang) {
      await runTranslation(lang);
    }
  }, [formik, runTranslation]);

  const handleContactSelect = useCallback((contact: Contact | null) => {
    if (contact) {
      formik.setFieldValue('to', contact.phone || '');
    } else {
      formik.setFieldValue('to', '');
    }
  }, [formik]);

  const handlePromptSelect = useCallback((prompt: PromptTemplate | null) => {
    if (prompt) {
      setSelectedPromptId(prompt._id);
      formik.setFieldValue('systemPrompt', prompt.systemPrompt);
      if (prompt.firstMessage) formik.setFieldValue('message', prompt.firstMessage);
    } else {
      setSelectedPromptId(null);
      formik.setFieldValue('systemPrompt', '');
    }
  }, [formik]);

  const disabled = loading || isCallActive;
  const isCallReady = Boolean(formik.values.to && formik.values.voice && formik.values.language);

  return (
    <form onSubmit={formik.handleSubmit} aria-label="Make a call">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, position: 'relative' }}>
        {/* Translating overlay */}
        <Backdrop open={translating} sx={{ position: 'absolute', zIndex: 10, bgcolor: 'rgba(255,255,255,0.7)', borderRadius: 1 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={24} />
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>Translating...</Typography>
          </Box>
        </Backdrop>

        {/* Contact search dropdown */}
        <ContactAutocomplete onSelect={handleContactSelect} disabled={disabled} />

        {/* Dial Pad */}
        <DialPad value={formik.values.to} onChange={(v) => formik.setFieldValue('to', v)} disabled={disabled} />

        <Chip icon={<RecordVoiceOverIcon />} label={getVoiceLabel(formik.values.voice)}
          onClick={() => onVoiceDialogToggle(true)} variant="outlined" disabled={disabled}
          aria-label={`Voice: ${getVoiceLabel(formik.values.voice)}. Click to change`}
          sx={{ width: '100%', justifyContent: 'flex-start', height: 32, fontSize: '0.72rem', transition: 'all 0.2s ease' }} />

        <Dialog open={voiceDialogOpen} onClose={() => onVoiceDialogToggle(false)} maxWidth="md" fullWidth>
          <DialogTitle>Select Voice</DialogTitle>
          <DialogContent>
            <VoiceSelector value={formik.values.voice} onChange={(v) => {
              formik.setFieldValue('voice', v);
              formik.setFieldValue('language', getVoiceLanguageCode(v));
            }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => onVoiceDialogToggle(false)} variant="contained">Done</Button>
          </DialogActions>
        </Dialog>

        <TextField fullWidth size="small" label="First Message" name="message"
          value={formik.values.message} onChange={formik.handleChange}
          multiline rows={2} disabled={disabled} />

        <Box sx={{ border: '1px solid', borderColor: 'divider', p: 0.8, borderRadius: 1, transition: 'all 0.2s ease' }}>
          <FormControlLabel
            control={<Switch checked={formik.values.aiEnabled}
              onChange={(e) => formik.setFieldValue('aiEnabled', e.target.checked)}
              size="small" disabled={disabled} />}
            label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <SmartToyIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2" sx={{ fontSize: '0.78rem' }}>AI Mode</Typography>
            </Box>}
          />
          <Collapse in={formik.values.aiEnabled}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 0.5 }}>
              {/* AI Model selector */}
              <TextField select fullWidth size="small" label="AI Model" value={aiModel}
                onChange={(e) => setAiModel(e.target.value)} disabled={disabled}>
                {AI_MODELS.map((m) => (
                  <MenuItem key={m.id} value={m.id} sx={{ fontSize: '0.75rem' }}>
                    {m.label} <Chip label={m.tier} size="small" sx={{ ml: 0.5, height: 16, fontSize: '0.6rem' }} />
                  </MenuItem>
                ))}
              </TextField>
              <AgentPromptSelect value={selectedPromptId} onChange={handlePromptSelect} disabled={disabled} />
              <TextField fullWidth size="small" label="Agent Prompt (from library)" name="systemPrompt"
                value={formik.values.systemPrompt} onChange={formik.handleChange}
                multiline rows={2} disabled={disabled}
                helperText="Loaded from selected prompt template" />
              <TextField fullWidth size="small" label="Additional Prompt"
                value={formik.values.additionalPrompt || ''} onChange={(e) => formik.setFieldValue('additionalPrompt', e.target.value)}
                multiline rows={2} disabled={disabled}
                helperText="Extra instructions for this specific call" />
            </Box>
          </Collapse>
        </Box>

        {/* Language at the bottom */}
        <LanguageSelect value={formik.values.language} onChange={handleLanguageChange} disabled={disabled} />
        <Button
          size="small"
          variant="text"
          startIcon={translating ? <CircularProgress size={14} /> : <TranslateIcon />}
          onClick={() => runTranslation(formik.values.language)}
          disabled={disabled || translating}
          sx={{ alignSelf: 'flex-start', fontSize: '0.7rem', textTransform: 'none' }}
        >
          {translating ? 'Translating...' : 'Click to Translate'}
        </Button>

        <Button type="submit" variant="contained" fullWidth
          disabled={disabled || !isCallReady}
          startIcon={loading ? <CircularProgress size={16} /> : <CallIcon />}
          aria-label={loading ? 'Calling in progress' : 'Start call'}
          sx={{
            py: 0.8, fontSize: '0.8rem',
            transition: 'all 0.2s ease',
            '&:not(:disabled):hover': { transform: 'translateY(-1px)', boxShadow: 4 },
            '&:not(:disabled):active': { transform: 'translateY(0)' },
          }}>
          {loading ? 'Calling...' : 'Call'}
        </Button>
      </Box>
    </form>
  );
};

export default DialerForm;
