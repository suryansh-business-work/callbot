import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

interface CodeBlockProps {
  examples: { label: string; code: string }[];
}

const CodeBlock = ({ examples }: CodeBlockProps) => {
  const [tab, setTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(examples[tab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: '0.85rem' }}>
        Code Examples
      </Typography>
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'action.hover',
            borderBottom: '1px solid',
            borderColor: 'divider',
            px: 1,
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              minHeight: 36,
              '& .MuiTab-root': { minHeight: 36, fontSize: '0.72rem', py: 0.5, textTransform: 'none' },
            }}
          >
            {examples.map((ex) => (
              <Tab key={ex.label} label={ex.label} />
            ))}
          </Tabs>
          <IconButton size="small" onClick={handleCopy} sx={{ color: copied ? 'success.main' : 'text.secondary' }}>
            {copied ? <CheckIcon sx={{ fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        </Box>
        <Box
          component="pre"
          sx={{
            m: 0,
            p: 2,
            overflow: 'auto',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            lineHeight: 1.6,
            bgcolor: (t) => (t.palette.mode === 'dark' ? '#1e1e1e' : '#f8f9fa'),
            color: 'text.primary',
            maxHeight: 400,
          }}
        >
          {examples[tab].code}
        </Box>
      </Box>
    </Box>
  );
};

export default CodeBlock;
