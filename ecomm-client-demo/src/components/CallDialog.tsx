import { useState, useEffect, useRef } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import axios from 'axios';
import { CartItem, CUSTOMER } from '../types';

interface CallDialogProps {
  open: boolean;
  onClose: () => void;
  cartItems: CartItem[];
}

type CallStatus = 'idle' | 'calling' | 'success' | 'error';

const buildPrompt = (items: CartItem[]): string => {
  const productLines = items
    .map(
      (i) =>
        `- ${i.product.name} (${i.product.brand}) — ₹${i.product.price.toLocaleString('en-IN')} x${i.quantity}\n  Features: ${i.product.highlights.join(', ')}\n  ${i.product.description}`,
    )
    .join('\n');

  return `You are a friendly and professional e-commerce sales assistant from TechStore calling customer ${CUSTOMER.name} about the products in their shopping cart. Your SOLE PURPOSE is to help them learn about their cart items and encourage them to complete the purchase.

CART ITEMS:
${productLines}

TOTAL: ₹${items.reduce((s, i) => s + i.product.price * i.quantity, 0).toLocaleString('en-IN')}

STRICT RULES:
Only Hindi
1. ONLY discuss the products listed in the cart above. Never discuss other products or topics.
2. If the customer asks about anything unrelated, politely redirect: "That's interesting! But let me tell you more about the amazing products in your cart..."
3. Highlight unique selling points, key features, and value of each product.
4. Be conversational, warm, and enthusiastic but not pushy.
5. If they express interest in buying, enthusiastically confirm and say you'll process the order right away.
6. Keep responses to 1-3 sentences suitable for a phone conversation.
7. Always refer to the customer as ${CUSTOMER.name}.
8. Speak in a natural, friendly tone like a knowledgeable tech advisor.
9. If asked about discounts, mention we have the best prices and free delivery on all orders.`;
};

const buildFirstMessage = (items: CartItem[]): string => {
  const names = items.map((i) => i.product.name).slice(0, 3);
  const more = items.length > 3 ? ` and ${items.length - 3} more` : '';
  return `Hey ${CUSTOMER.name}! Your cart is calling! You've added some fantastic picks — ${names.join(', ')}${more}. If you'd like to know more about any of them, I'm right here to help!`;
};

const CallDialog = ({ open, onClose, cartItems }: CallDialogProps) => {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const callingRef = useRef(false);

  const startCall = async () => {
    if (callingRef.current) return;
    callingRef.current = true;
    setStatus('calling');
    setErrorMsg('');
    try {
      await axios.post('/api/v1/call', {
        phone: CUSTOMER.phone,
        firstMessage: buildFirstMessage(cartItems),
        voice: 'shubh',
        model: 'gpt-4o-mini',
        language: 'hi-IN',
        streaming: false,
        prompt: buildPrompt(cartItems),
      });
      setStatus('success');
    } catch (err: unknown) {
      setStatus('error');
      if (axios.isAxiosError(err)) {
        setErrorMsg(err.response?.data?.message || 'Failed to initiate call');
      } else {
        setErrorMsg('Something went wrong');
      }
    } finally {
      callingRef.current = false;
    }
  };

  // Fire the call exactly once when dialog opens
  useEffect(() => {
    if (open && cartItems.length > 0) {
      startCall();
    }
    if (!open) {
      setStatus('idle');
      setErrorMsg('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <IconButton onClick={handleClose} sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
        <CloseIcon sx={{ fontSize: 20 }} />
      </IconButton>
      <DialogContent sx={{ textAlign: 'center', py: 5, px: 3 }}>
        {(status === 'idle' || status === 'calling') && (
          <>
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(99,102,241,0.4)' },
                    '50%': { boxShadow: '0 0 0 20px rgba(99,102,241,0)' },
                  },
                }}
              >
                <PhoneInTalkIcon sx={{ fontSize: 36, color: '#fff' }} />
              </Box>
              <CircularProgress
                size={96}
                thickness={2}
                sx={{
                  position: 'absolute',
                  top: -8,
                  left: -8,
                  color: '#6366F1',
                  opacity: 0.4,
                }}
              />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
              Calling {CUSTOMER.name}...
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', mb: 1 }}>
              {CUSTOMER.phone}
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
              Our AI assistant will discuss your {cartItems.length} cart item{cartItems.length > 1 ? 's' : ''}
            </Typography>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircleIcon sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
              Call Connected!
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', mb: 2, maxWidth: 280, mx: 'auto' }}>
              Our AI assistant is now discussing your cart items with {CUSTOMER.name}. You'll receive the call shortly!
            </Typography>
            <Button variant="outlined" onClick={handleClose} sx={{ borderRadius: 2 }}>
              Close
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <ErrorIcon sx={{ fontSize: 72, color: 'error.main', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
              Call Failed
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', mb: 2 }}>
              {errorMsg}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              <Button variant="contained" onClick={() => startCall()} sx={{ borderRadius: 2 }}>
                Retry
              </Button>
              <Button variant="outlined" onClick={handleClose} sx={{ borderRadius: 2 }}>
                Close
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CallDialog;
