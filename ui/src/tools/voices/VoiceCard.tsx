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
import toast from 'react-hot-toast';
import { VoiceEntry } from './voices.data';
import apiClient from '../../api/apiClient';

interface VoiceCardProps {
  voice: VoiceEntry;
  selected: boolean;
  onSelect: (id: string) => void;
  previewText?: string;
}

const VoiceCard = ({ voice, selected, onSelect, previewText }: VoiceCardProps) => {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const blobUrlRef = useRef<string | null>(null);

  // Cancel any in-flight request and stop audio when component unmounts.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      audioRef.current?.pause();
      audioRef.current = null;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  const handlePlaySample = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (playing) {
      audioRef.current?.pause();
      audioRef.current = null;
      abortRef.current?.abort();
      abortRef.current = null;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setPlaying(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      const { data } = await apiClient.post<{ audio: string; contentType?: string }>(
        '/tts/preview',
        { speaker: voice.id, language: voice.languageCode, text: previewText || undefined },
        { signal: controller.signal }
      );

      // Ignore if aborted while request was in flight.
      if (controller.signal.aborted) return;

      const mime = data.contentType || 'audio/wav';

      // Decode base64 to binary and create a Blob URL (more reliable than data URIs)
      const binaryStr = atob(data.audio);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mime });
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setPlaying(false);
        audioRef.current = null;
        if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
      };
      audio.onerror = () => {
        setPlaying(false);
        audioRef.current = null;
        if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
      };
      await audio.play();
      setPlaying(true);
    } catch (err: unknown) {
      // Axios CancelledError / AbortError are expected on unmount — suppress.
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) return;
      if (axios.isCancel(err)) return;

      // Show user-friendly error from server when available
      const serverMsg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : 'Voice preview failed — check API key configuration';
      toast.error(serverMsg);
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
        p: 2,
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        borderLeft: selected ? '3px solid' : '1px solid',
        borderLeftColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? (t) => alpha(t.palette.primary.main, 0.04) : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: selected ? (t) => `0 0 12px ${alpha(t.palette.primary.main, 0.08)}` : 'none',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: (t) => alpha(t.palette.primary.main, 0.02),
          boxShadow: (t) => `0 0 12px ${alpha(t.palette.primary.main, 0.06)}`,
        },
      }}
    >
      <Radio checked={selected} size="small" sx={{ p: 0.3, mt: 0.2 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.8 }}>
          <PersonIcon sx={{ fontSize: 16, color: selected ? 'primary.main' : 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontWeight: 700, color: selected ? 'primary.main' : 'text.primary' }}>
            {voice.name}
          </Typography>
          <IconButton
            size="small"
            onClick={handlePlaySample}
            disabled={loading}
            sx={{
              ml: 'auto',
              color: playing ? 'error.main' : 'primary.main',
              p: 0.5,
              border: '1px solid',
              borderColor: playing ? 'error.main' : 'divider',
              width: 26,
              height: 26,
              '&:hover': {
                borderColor: playing ? 'error.main' : 'primary.main',
                boxShadow: (t) => `0 0 8px ${alpha(playing ? t.palette.error.main : t.palette.primary.main, 0.2)}`,
              },
            }}
          >
            {loading ? <CircularProgress size={14} /> : playing ? <StopIcon sx={{ fontSize: 14 }} /> : <PlayArrowIcon sx={{ fontSize: 14 }} />}
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          <Chip
            label={voice.gender}
            size="small"
            variant="outlined"
            sx={{
              height: 20,
              fontSize: '0.6rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              borderColor: voice.gender === 'feminine' ? '#EC4899' : '#3B82F6',
              color: voice.gender === 'feminine' ? '#EC4899' : '#3B82F6',
            }}
          />
          {voice.tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 500 }} />
          ))}
          {voice.languages.map((lang) => (
            <Chip
              key={lang}
              label={lang}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.6rem',
                fontWeight: 600,
                bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                color: 'primary.main',
                border: '1px solid',
                borderColor: (t) => alpha(t.palette.primary.main, 0.2),
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default VoiceCard;
