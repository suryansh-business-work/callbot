import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import toast from 'react-hot-toast';
import { useFormik } from 'formik';
import { makeCallValidationSchema, makeCallInitialValues, MakeCallFormValues } from '../calls.validation';
import { makeCall, makeAiCall } from '../calls.api';
import { CallResponse, VoiceOption } from '../calls.types';
import { fetchAgentById } from '../../agents/agents.api';
import { useVoice } from '../../../context/VoiceContext';
import { useModel } from '../../../context/ModelContext';
import DialerDisplay, { DialerIdle } from './DialerDisplay';
import DialerForm from './DialerForm';

interface HistorySelection {
  to: string;
  voice: string;
  language: string;
  aiEnabled: boolean;
  systemPrompt: string;
  message: string;
}

interface DialerPanelProps {
  agentId?: string;
  activeCallSid: string | null;
  isCallActive: boolean;
  activePhone: string;
  onCallStarted: (callSid: string, phone: string, initialMsg?: string) => void;
  onCallEnded: () => void;
  historySelection?: HistorySelection | null;
}

const DialerPanel = ({ agentId, activeCallSid, isCallActive, activePhone, onCallStarted, onCallEnded, historySelection }: DialerPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [voiceDialogOpen, setVoiceDialogOpen] = useState(false);
  const { language: globalLanguage } = useVoice();
  const { aiModel } = useModel();

  const formik = useFormik<MakeCallFormValues>({
    initialValues: { ...makeCallInitialValues, language: globalLanguage },
    validationSchema: makeCallValidationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        let response: CallResponse;
        if (values.aiEnabled) {
          const combinedPrompt = [values.systemPrompt, values.additionalPrompt].filter(Boolean).join('\n\n');
          response = await makeAiCall({
            to: values.to,
            message: values.message || undefined,
            voice: values.voice as VoiceOption,
            systemPrompt: combinedPrompt || undefined,
            agentId,
            language: values.language,
            aiModel,
          });
        } else {
          response = await makeCall({
            to: values.to,
            message: values.message || undefined,
            voice: values.voice as VoiceOption,
            agentId,
            language: values.language,
          });
        }
        if (response.success && response.data) {
          toast.success(values.aiEnabled ? 'AI call started!' : 'Call initiated!');
          onCallStarted(
            response.data.callSid,
            values.to,
            values.aiEnabled ? (values.message || 'Hello! I am your AI assistant.') : undefined
          );
        } else {
          toast.error(response.message);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Call failed';
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
  });

  // Load agent defaults
  useEffect(() => {
    if (!agentId) return;
    const loadAgent = async () => {
      try {
        const res = await fetchAgentById(agentId);
        if (res.success && res.data) {
          formik.setFieldValue('aiEnabled', true);
          formik.setFieldValue('systemPrompt', res.data.systemPrompt);
          formik.setFieldValue('message', res.data.greeting);
        }
      } catch { /* ignore */ }
    };
    loadAgent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  // Apply history selection
  useEffect(() => {
    if (!historySelection) return;
    formik.setFieldValue('to', historySelection.to);
    formik.setFieldValue('voice', historySelection.voice);
    formik.setFieldValue('language', historySelection.language);
    formik.setFieldValue('aiEnabled', historySelection.aiEnabled);
    if (historySelection.systemPrompt) formik.setFieldValue('systemPrompt', historySelection.systemPrompt);
    if (historySelection.message) formik.setFieldValue('message', historySelection.message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historySelection]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, height: '100%', p: 0.5 }}>
      {activeCallSid ? (
        <DialerDisplay phoneNumber={activePhone} isActive={isCallActive} duration={0} onHangup={onCallEnded} />
      ) : (
        <DialerIdle phoneNumber={formik.values.to} />
      )}

      <Card sx={{ flex: 1, overflow: 'auto' }}>
        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
          <DialerForm
            formik={formik}
            loading={loading}
            isCallActive={isCallActive}
            voiceDialogOpen={voiceDialogOpen}
            onVoiceDialogToggle={setVoiceDialogOpen}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default DialerPanel;
