import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { useParams } from 'react-router-dom';
import DialerPanel from './components/DialerPanel';
import CallLogsPanelCard from './components/CallLogsPanelCard';
import ChatPanel from './components/ChatPanel';
import { ConversationEvent, CallLogItem } from './calls.types';
import { fetchCallDetail } from './calls.api';
import { useSocket } from '../../context/SocketContext';

interface HistorySelection {
  to: string;
  voice: string;
  language: string;
  aiEnabled: boolean;
  systemPrompt: string;
  message: string;
}

const AgentCallPage = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const { socket } = useSocket();
  const [activeCallSid, setActiveCallSid] = useState<string | null>(null);
  const [events, setEvents] = useState<ConversationEvent[]>([]);
  const [isCallActive, setIsCallActive] = useState(false);
  const [activePhone, setActivePhone] = useState('');
  const [historySelection, setHistorySelection] = useState<HistorySelection | null>(null);

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

  return (
    <Box sx={{
      height: '100%',
      mx: { xs: -1, sm: -2, md: -3 },
      my: { xs: -1, sm: -2 },
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <Grid container sx={{ flex: 1, minHeight: 0 }}>
        <Grid item xs={12} md={2.5} sx={{ display: 'flex', flexDirection: 'column', height: '100%', borderRight: { md: '1px solid' }, borderColor: { md: 'divider' }, overflow: 'hidden' }}>
          <DialerPanel
            agentId={agentId}
            activeCallSid={activeCallSid}
            isCallActive={isCallActive}
            activePhone={activePhone}
            onCallStarted={handleCallStarted}
            onCallEnded={handleCallEnded}
            historySelection={historySelection}
          />
        </Grid>
        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', height: '100%', borderRight: { md: '1px solid' }, borderColor: { md: 'divider' }, overflow: 'hidden' }}>
          <CallLogsPanelCard onSelectLog={handleSelectLog} />
        </Grid>
        <Grid item xs={12} md={3.5} sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <ChatPanel events={events} isActive={isCallActive} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AgentCallPage;
