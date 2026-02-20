import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import SplitPane from 'react-split-pane';
import { useParams, useSearchParams } from 'react-router-dom';
import DialerPanel from './components/DialerPanel';
import CallLogsPanelCard from './components/CallLogsPanelCard';
import ChatPanel from './components/ChatPanel';
import CostPanel from './components/CostPanel';
import { ConversationEvent, CallLogItem } from './calls.types';
import { fetchCallDetail } from './calls.api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

interface HistorySelection {
  to: string;
  voice: string;
  language: string;
  aiEnabled: boolean;
  systemPrompt: string;
  message: string;
}

/** localStorage helper for split pane sizes keyed by user */
const PANE_KEY_PREFIX = 'call_pane_';
const getPaneKey = (userId: string, pane: string) => `${PANE_KEY_PREFIX}${userId}_${pane}`;
const loadPaneSize = (userId: string, pane: string, fallback: number | string) => {
  try {
    const val = localStorage.getItem(getPaneKey(userId, pane));
    if (!val) return fallback;
    return val.includes('%') ? val : Number(val);
  } catch { return fallback; }
};
const savePaneSize = (userId: string, pane: string, size: number) => {
  try { localStorage.setItem(getPaneKey(userId, pane), String(size)); } catch { /* ignore */ }
};

const AgentCallPage = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const [searchParams] = useSearchParams();
  const initialPhone = searchParams.get('phone') || '';
  const { socket } = useSocket();
  const { user } = useAuth();
  const uid = user?._id || 'default';
  const [activeCallSid, setActiveCallSid] = useState<string | null>(null);
  const [events, setEvents] = useState<ConversationEvent[]>([]);
  const [isCallActive, setIsCallActive] = useState(false);
  const [activePhone, setActivePhone] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [historySelection, setHistorySelection] = useState<HistorySelection | null>(null);

  useEffect(() => {
    if (!isCallActive) { setCallDuration(0); return; }
    const t = setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [isCallActive]);

  const handleCallStarted = useCallback((callSid: string, phone: string, initialMsg?: string) => {
    setActiveCallSid(callSid);
    setActivePhone(phone);
    setIsCallActive(true);
    setHistorySelection(null);
    setEvents(initialMsg ? [{
      callSid, type: 'ai_message', content: initialMsg, timestamp: new Date().toISOString(),
    }] : []);
  }, []);

  const handleCallEnded = useCallback(() => {
    setIsCallActive(false);
    setActiveCallSid(null);
    setActivePhone('');
  }, []);

  const handleSelectLog = useCallback(async (log: CallLogItem) => {
    try {
      const detail = await fetchCallDetail(log.callSid);
      const msgs: ConversationEvent[] = (detail?.data?.conversationMessages || []).map(
        (m: { role: string; content: string; timestamp: string }) => ({
          callSid: log.callSid,
          type: m.role === 'user' ? 'user_message' as const : 'ai_message' as const,
          content: m.content,
          timestamp: m.timestamp,
        })
      );
      setEvents(msgs);
    } catch {
      setEvents([]);
    }
    setActiveCallSid(null);
    setIsCallActive(false);
    setActivePhone('');
    setHistorySelection({
      to: log.to,
      voice: log.voice || 'Polly.Joanna-Neural',
      language: log.language || 'en-US',
      aiEnabled: Boolean(log.agentId),
      systemPrompt: '',
      message: '',
    });
  }, []);

  useEffect(() => {
    if (!socket || !activeCallSid) return;
    socket.emit('join:call', activeCallSid);

    const handleUpdate = (event: ConversationEvent) => {
      if (event.callSid !== activeCallSid) return;
      setEvents((prev) => [...prev, event]);
      if (event.type === 'call_ended') {
        setIsCallActive(false);
        setActiveCallSid(null);
        setActivePhone('');
      }
    };

    socket.on('conversation:update', handleUpdate);
    return () => {
      socket.off('conversation:update', handleUpdate);
      socket.emit('leave:call', activeCallSid);
    };
  }, [socket, activeCallSid]);

  const panelSx = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    borderRadius: '4px',
  };

  return (
    <Box
      sx={{
        height: '100%',
        mx: { xs: -1, sm: -2, md: -3 },
        my: { xs: -1, sm: -2 },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        '& .SplitPane': { position: 'relative !important' as string },
        '& .Pane': { overflow: 'hidden' },
        '& .Resizer': {
          background: 'transparent',
          opacity: 1,
          zIndex: 1,
          boxSizing: 'border-box',
          backgroundClip: 'padding-box',
        },
        '& .Resizer.vertical': {
          width: 8,
          mx: '1px',
          borderRadius: '4px',
          background: (t) => t.palette.divider,
          cursor: 'col-resize',
          transition: 'background 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            background: (t) => t.palette.primary.main,
            boxShadow: (t) => `0 0 6px ${t.palette.primary.main}40`,
          },
        },
      }}
    >
      {/* @ts-expect-error react-split-pane types mismatch with React 18 */}
      <SplitPane
        split="vertical"
        minSize={220}
        maxSize={400}
        defaultSize={loadPaneSize(uid, 'left', 280)}
        onChange={(size: number) => savePaneSize(uid, 'left', size)}
        style={{ flex: 1, position: 'relative' }}
      >
        <Box sx={{ ...panelSx, gap: 0.5, p: 0.5 }}>
          <Box sx={{ flex: '1 1 auto', overflow: 'hidden' }}>
            <DialerPanel
              agentId={agentId}
              initialPhone={initialPhone}
              activeCallSid={activeCallSid}
              isCallActive={isCallActive}
              activePhone={activePhone}
              onCallStarted={handleCallStarted}
              onCallEnded={handleCallEnded}
              historySelection={historySelection}
            />
          </Box>
          <Box sx={{ flex: '0 0 auto', overflow: 'auto', maxHeight: '50%' }}>
            <CostPanel callDuration={callDuration} isCallActive={isCallActive} />
          </Box>
        </Box>
        {/* @ts-expect-error react-split-pane types mismatch with React 18 */}
        <SplitPane
          split="vertical"
          minSize={300}
          maxSize={-300}
          defaultSize={loadPaneSize(uid, 'right', '65%')}
          onChange={(size: number) => savePaneSize(uid, 'right', size)}
          style={{ position: 'relative' }}
        >
          <Box sx={{ ...panelSx, p: 0.5 }}>
            <CallLogsPanelCard onSelectLog={handleSelectLog} />
          </Box>
          <Box sx={{ ...panelSx, p: 0.5 }}>
            <ChatPanel events={events} isActive={isCallActive} />
          </Box>
        </SplitPane>
      </SplitPane>
    </Box>
  );
};

export default AgentCallPage;
