import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import AppBreadcrumb from '../../components/AppBreadcrumb';
import ParamsTable from './components/ParamsTable';
import CodeBlock from './components/CodeBlock';
import ResponsesSection from './components/ResponsesSection';
import TryItPanel from './components/TryItPanel';
import {
  CALL_API_PARAMS,
  CALL_API_RESPONSES,
  CURL_EXAMPLE,
  JS_EXAMPLE,
  PYTHON_EXAMPLE,
} from './apidocs.constants';

const ApiDocsPage = () => {
  const baseUrl = window.location.origin;
  const withBase = (code: string) => code.replace(/\{BASE_URL\}/g, baseUrl);

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto' }}>
      <AppBreadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'API Docs' }]} />

      {/* ── Header ── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, fontSize: { xs: '1.1rem', sm: '1.3rem' }, mb: 0.5 }}>
          API Documentation
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
          Use this REST API to programmatically initiate AI-powered phone calls.
        </Typography>
      </Box>

      {/* ── Authentication ── */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, fontSize: '0.85rem' }}>
          Authentication
        </Typography>
        <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mb: 1 }}>
          All API requests require a JWT Bearer token in the Authorization header.
          Obtain a token by logging in via <code>POST /api/auth/login</code>.
        </Typography>
        <Box
          component="pre"
          sx={{
            p: 1.5,
            borderRadius: 1,
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            bgcolor: (t) => (t.palette.mode === 'dark' ? '#1e1e1e' : '#f8f9fa'),
            overflow: 'auto',
          }}
        >
          {`Authorization: Bearer <your_jwt_token>`}
        </Box>
      </Paper>

      <Divider sx={{ mb: 3 }} />

      {/* ── Endpoint Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <Chip label="POST" color="success" size="small" sx={{ fontWeight: 700, fontFamily: 'monospace' }} />
        <Typography
          component="code"
          sx={{
            fontSize: '0.88rem',
            fontFamily: 'monospace',
            fontWeight: 600,
            bgcolor: 'action.hover',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
          }}
        >
          /api/v1/call
        </Typography>
        <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
          Initiate an AI-powered phone call
        </Typography>
      </Box>

      {/* ── Parameters ── */}
      <ParamsTable params={CALL_API_PARAMS} />

      {/* ── Code Examples ── */}
      <CodeBlock
        examples={[
          { label: 'cURL', code: withBase(CURL_EXAMPLE) },
          { label: 'JavaScript', code: withBase(JS_EXAMPLE) },
          { label: 'Python', code: withBase(PYTHON_EXAMPLE) },
        ]}
      />

      {/* ── Responses ── */}
      <ResponsesSection responses={CALL_API_RESPONSES} />

      {/* ── Try It ── */}
      <Divider sx={{ mb: 3 }} />
      <TryItPanel />
    </Box>
  );
};

export default ApiDocsPage;
