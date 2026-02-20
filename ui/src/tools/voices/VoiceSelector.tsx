import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Grid from '@mui/material/Grid';
import SearchIcon from '@mui/icons-material/Search';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import { ALL_VOICES, getVoiceById } from './voices.data';
import VoiceCard from './VoiceCard';

interface VoiceSelectorProps {
  value: string;
  onChange: (voiceId: string) => void;
  disabled?: boolean;
}

const VoiceSelector = ({ value, onChange, disabled }: VoiceSelectorProps) => {
  const [tab, setTab] = useState<'all' | 'feminine' | 'masculine'>('all');
  const [search, setSearch] = useState('');
  const [previewText, setPreviewText] = useState('Hello, I am your AI assistant. How can I help you today?');

  const filtered = useMemo(() => {
    let list = tab === 'all' ? ALL_VOICES : ALL_VOICES.filter((v) => v.gender === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.tags.some((t) => t.includes(q)) ||
          v.gender.includes(q)
      );
    }
    return list;
  }, [tab, search]);

  const selectedVoice = getVoiceById(value);

  return (
    <Box sx={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      {/* Header bar */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 1, mb: 1.5,
      }}>
        <Box>
          <Typography variant="caption" color="text.secondary">Selected Voice</Typography>
          <Typography variant="body2" fontWeight={600} color="primary.main">
            {selectedVoice ? selectedVoice.name : 'None Selected'}
          </Typography>
        </Box>
      </Box>

      {/* Tabs — filter by gender */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ minHeight: 36, mb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Tab label="All" value="all" sx={{ minHeight: 36, py: 0.5 }} />
        <Tab label="Feminine" value="feminine" sx={{ minHeight: 36, py: 0.5 }} />
        <Tab label="Masculine" value="masculine" sx={{ minHeight: 36, py: 0.5 }} />
      </Tabs>

      {/* Search */}
      <TextField
        placeholder="Search voices..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        size="small"
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
        }}
        sx={{ mb: 1.5 }}
      />

      {/* Preview text */}
      <TextField
        label="Preview Text"
        placeholder="Type text to preview voices..."
        value={previewText}
        onChange={(e) => setPreviewText(e.target.value)}
        fullWidth
        size="small"
        multiline
        minRows={2}
        maxRows={3}
        InputProps={{
          startAdornment: <InputAdornment position="start"><RecordVoiceOverIcon fontSize="small" sx={{ mt: 0.5 }} /></InputAdornment>,
        }}
        sx={{ mb: 1.5 }}
      />

      {/* Voice grid */}
      <Box sx={{ maxHeight: 320, overflowY: 'auto', pr: 0.5 }}>
        {filtered.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
            No voices match your search.
          </Typography>
        ) : (
          <Grid container spacing={1}>
            {filtered.map((voice) => (
              <Grid item xs={12} sm={6} key={voice.id}>
                <VoiceCard voice={voice} selected={value === voice.id} onSelect={onChange} previewText={previewText} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default VoiceSelector;
