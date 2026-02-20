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
import StreamIcon from '@mui/icons-material/Stream';
import { alpha } from '@mui/material/styles';
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

        {/* 1. Contact search */}
        <ContactAutocomplete onSelect={handleContactSelect} disabled={disabled} />

        {/* 2. Dial Pad — full width */}
        <DialPad value={formik.values.to} onChange={(v) => formik.setFieldValue('to', v)} disabled={disabled} />

        {/* 3. Voice selector chip */}
        <Chip
          icon={<RecordVoiceOverIcon />}
          label={getVoiceLabel(formik.values.voice)}
          onClick={() => onVoiceDialogToggle(true)}
          variant="outlined"
          disabled={disabled}
          aria-label={`Voice: ${getVoiceLabel(formik.values.voice)}. Click to change`}
          sx={{ width: '100%', justifyContent: 'flex-start', height: 36, fontSize: '0.72rem' }}
        />

        {/* 4. First Message */}
        <TextField
          fullWidth size="small" label="First Message" name="message"
          value={formik.values.message} onChange={formik.handleChange}
          multiline rows={3} disabled={disabled}
          InputProps={{ sx: { fontSize: '0.78rem' } }}
        />

        {/* Voice Dialog */}
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

        {/* 5. AI Mode — full width */}
        <Box sx={{
          border: '2px solid',
          borderColor: formik.values.aiEnabled ? 'primary.main' : 'divider',
          bgcolor: formik.values.aiEnabled ? (t) => alpha(t.palette.primary.main, 0.04) : 'transparent',
          p: 0.8, borderRadius: 1, transition: 'all 0.2s ease',
        }}>
          <FormControlLabel
            control={<Switch checked={formik.values.aiEnabled}
              onChange={(e) => formik.setFieldValue('aiEnabled', e.target.checked)}
              size="small" disabled={disabled} />}
            label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <SmartToyIcon sx={{ fontSize: 16, color: formik.values.aiEnabled ? 'primary.main' : 'text.secondary' }} />
              <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: formik.values.aiEnabled ? 700 : 400 }}>AI Mode</Typography>
            </Box>}
          />
        </Box>

        {/* 6. Language — full width */}
        <Box sx={{
          border: '2px solid', borderColor: 'primary.main',
          bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
          p: 0.8, borderRadius: 1,
        }}>
          <LanguageSelect value={formik.values.language} onChange={handleLanguageChange} disabled={disabled} />
        </Box>

        {/* 7. AI settings (collapse) */}
        <Collapse in={formik.values.aiEnabled}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 0.5 }}>
            <TextField select fullWidth size="small" label="AI Model" value={aiModel}
              onChange={(e) => setAiModel(e.target.value)} disabled={disabled}>
              {AI_MODELS.map((m) => (
                <MenuItem key={m.id} value={m.id} sx={{ fontSize: '0.75rem' }}>
                  {m.label} <Chip label={m.tier} size="small" sx={{ ml: 0.5, height: 16, fontSize: '0.6rem' }} />
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{
              border: '1px solid',
              borderColor: formik.values.streaming ? 'success.main' : 'divider',
              bgcolor: formik.values.streaming ? (t) => alpha(t.palette.success.main, 0.06) : 'transparent',
              p: 0.6, borderRadius: 1, transition: 'all 0.2s ease',
            }}>
              <FormControlLabel
                control={<Switch checked={formik.values.streaming}
                  onChange={(e) => formik.setFieldValue('streaming', e.target.checked)}
                  size="small" disabled={disabled} color="success" />}
                label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <StreamIcon sx={{ fontSize: 15, color: formik.values.streaming ? 'success.main' : 'text.secondary' }} />
                  <Typography variant="body2" sx={{ fontSize: '0.72rem', fontWeight: formik.values.streaming ? 700 : 400 }}>
                    Streaming Mode
                  </Typography>
                  <Chip label="Beta" size="small" color="success" variant="outlined"
                    sx={{ height: 16, fontSize: '0.55rem', ml: 0.5 }} />
                </Box>}
              />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.62rem', ml: 4 }}>
                Real-time audio streaming for faster responses
              </Typography>
            </Box>
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

        {/* 8. Translate */}
        <Button
          size="small" variant="text"
          startIcon={translating ? <CircularProgress size={14} /> : <TranslateIcon />}
          onClick={() => runTranslation(formik.values.language)}
          disabled={disabled || translating}
          sx={{ alignSelf: 'flex-start', fontSize: '0.7rem', textTransform: 'none' }}
        >
          {translating ? 'Translating...' : 'Click to Translate'}
        </Button>

        {/* ── Call Button — Prominent ── */}
        <Button type="submit" variant="contained" fullWidth
          disabled={disabled || !isCallReady}
          startIcon={loading ? <CircularProgress size={18} /> : <CallIcon />}
          aria-label={loading ? 'Calling in progress' : 'Start call'}
          sx={{
            py: 1.2, fontSize: '0.9rem', fontWeight: 700,
            bgcolor: 'primary.main',
            boxShadow: (t) => `0 4px 14px ${alpha(t.palette.primary.main, 0.35)}`,
            transition: 'all 0.2s ease',
            '&:not(:disabled):hover': { transform: 'translateY(-2px)', boxShadow: (t) => `0 6px 20px ${alpha(t.palette.primary.main, 0.45)}` },
            '&:not(:disabled):active': { transform: 'translateY(0)' },
          }}>
          {loading ? 'Calling...' : 'Start Call'}
        </Button>
      </Box>
    </form>
  );
};

export default DialerForm;
