import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import BackspaceIcon from '@mui/icons-material/Backspace';
import CountryCodeSelect from './CountryCodeSelect';

interface DialPadProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const keys = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
];

const subLabels: Record<string, string> = {
  '1': '', '2': 'ABC', '3': 'DEF',
  '4': 'GHI', '5': 'JKL', '6': 'MNO',
  '7': 'PQRS', '8': 'TUV', '9': 'WXYZ',
  '*': '', '0': '+', '#': '',
};

const DialPad = ({ value, onChange, disabled }: DialPadProps) => {
  const [countryCode, setCountryCode] = useState('+91');

  const localNumber = value.startsWith(countryCode)
    ? value.slice(countryCode.length)
    : value.startsWith('+')
    ? value.replace(/^\+\d{1,4}/, '')
    : value;

  const handlePress = (key: string) => {
    if (disabled) return;
    const newLocal = localNumber + key;
    onChange(countryCode + newLocal);
  };

  const handleBackspace = () => {
    if (disabled || !localNumber) return;
    const newLocal = localNumber.slice(0, -1);
    onChange(newLocal ? countryCode + newLocal : '');
  };

  const handleCountryCodeChange = (code: string) => {
    setCountryCode(code);
    if (localNumber) {
      onChange(code + localNumber);
    }
  };

  return (
    <Box sx={{ width: '100%' }} role="group" aria-label="Dial pad">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <CountryCodeSelect
          value={countryCode}
          onChange={handleCountryCodeChange}
          disabled={disabled}
        />
        <Box sx={{ flex: 1, textAlign: 'center' }}>
          <Typography
            variant="h6"
            aria-live="polite"
            aria-label={`Phone number: ${value || 'empty'}`}
            sx={{ fontFamily: 'monospace', letterSpacing: 2, fontSize: { xs: '1rem', sm: '1.2rem' } }}
          >
            {value || countryCode}
          </Typography>
        </Box>
        {localNumber && (
          <IconButton size="small" onClick={handleBackspace} disabled={disabled} aria-label="Delete last digit" sx={{ color: 'text.secondary' }}>
            <BackspaceIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {keys.map((row, ri) => (
          <Box key={ri} sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
            {row.map((key) => (
              <Button
                key={key}
                onClick={() => handlePress(key)}
                disabled={disabled}
                variant="outlined"
                aria-label={`Dial ${key}${subLabels[key] ? ` (${subLabels[key]})` : ''}`}
                sx={{
                  flex: 1,
                  maxWidth: 72,
                  minHeight: 52,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0,
                  p: 0.5,
                  color: 'text.primary',
                  borderColor: 'divider',
                  transition: 'all 0.15s ease',
                  '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main', transform: 'scale(1.04)' },
                  '&:active': { bgcolor: 'primary.main', color: '#fff', transform: 'scale(0.96)' },
                  '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 1 },
                }}
              >
                <Typography variant="h6" sx={{ lineHeight: 1, fontWeight: 600 }}>
                  {key}
                </Typography>
                {subLabels[key] && (
                  <Typography variant="caption" sx={{ fontSize: '0.55rem', lineHeight: 1, letterSpacing: 1, opacity: 0.6 }}>
                    {subLabels[key]}
                  </Typography>
                )}
              </Button>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default DialPad;
