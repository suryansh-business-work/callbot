import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Radio from '@mui/material/Radio';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import axios from 'axios';
import { VoiceEntry } from './voices.data';
import apiClient from '../../api/apiClient';

interface VoiceCardProps {
  voice: VoiceEntry;
  selected: boolean;
  onSelect: (id: string) => void;
}

const VoiceCard = ({ voice, selected, onSelect }: VoiceCardProps) => {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cancel any in-flight request and stop audio when component unmounts.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const handlePlaySample = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (playing) {
      audioRef.current?.pause();
      audioRef.current = null;
      abortRef.current?.abort();
      abortRef.current = null;
      setPlaying(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      const { data } = await apiClient.post<{ audio: string; contentType?: string }>(
        '/tts/preview',
        { speaker: voice.id, language: voice.languageCode },
        { signal: controller.signal }
      );

      // Ignore if aborted while request was in flight.
      if (controller.signal.aborted) return;

      const mime = data.contentType || 'audio/wav';
      const audio = new Audio(`data:${mime};base64,${data.audio}`);
      audioRef.current = audio;
      audio.onended = () => { setPlaying(false); audioRef.current = null; };
      audio.onerror = () => { setPlaying(false); audioRef.current = null; };
      await audio.play();
      setPlaying(true);
    } catch (err: unknown) {
      // Axios CancelledError / AbortError are expected on unmount — suppress.
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) return;
      if (axios.isCancel(err)) return;
      console.error('Failed to play voice preview', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      onClick={() => onSelect(voice.id)}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        p: 1.5,
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? (t) => alpha(t.palette.primary.main, 0.06) : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.15s',
        '&:hover': { borderColor: 'primary.dark', bgcolor: (t) => alpha(t.palette.primary.main, 0.03) },
      }}
    >
      <Radio checked={selected} size="small" sx={{ p: 0.3, mt: 0.2 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2" fontWeight={600} color="text.primary">{voice.name}</Typography>
          <IconButton
            size="small"
            onClick={handlePlaySample}
            disabled={loading}
            sx={{ ml: 'auto', color: playing ? 'error.main' : 'primary.main', p: 0.3 }}
          >
            {loading ? <CircularProgress size={16} /> : playing ? <StopIcon sx={{ fontSize: 16 }} /> : <PlayArrowIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          <Chip
            label={voice.gender}
            size="small"
            variant="outlined"
            sx={{
              height: 20, fontSize: '0.65rem',
              borderColor: voice.gender === 'feminine' ? '#EC4899' : '#3B82F6',
              color: voice.gender === 'feminine' ? '#EC4899' : '#3B82F6',
            }}
          />
          {voice.tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
          ))}
          {voice.languages.map((lang) => (
            <Chip key={lang} label={lang} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(0,191,166,0.12)', color: 'primary.main' }} />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default VoiceCard;
