import { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import PhoneForwardedIcon from '@mui/icons-material/PhoneForwarded';
import { useFormik } from 'formik';
import toast from 'react-hot-toast';
import { makeCallValidationSchema, makeCallInitialValues, MakeCallFormValues } from '../calls.validation';
import { makeCall } from '../calls.api';
import { CallResponse } from '../calls.types';
import PhoneInputField from './PhoneInputField';
import MessageInputField from './MessageInputField';
import VoiceSelectField from './VoiceSelectField';
import CallResultAlert from './CallResultAlert';

const MakeCallForm = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CallResponse | null>(null);

  const formik = useFormik<MakeCallFormValues>({
    initialValues: makeCallInitialValues,
    validationSchema: makeCallValidationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setResult(null);
      try {
        const response = await makeCall({
          to: values.to,
          message: values.message || undefined,
          voice: values.voice as any,
        });
        setResult(response);
        if (response.success) {
          toast.success('Call initiated successfully!');
        } else {
          toast.error(response.message);
        }
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : 'Something went wrong';
        toast.error(errMsg);
        setResult({ success: false, message: errMsg });
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Card>
      <CardHeader
        title="Make a Call"
        subheader="Enter a phone number, select a natural AI voice, and customize your message"
        avatar={<PhoneForwardedIcon color="primary" />}
      />
      <CardContent>
        <form onSubmit={formik.handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <PhoneInputField
              value={formik.values.to}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              touched={formik.touched}
              errors={formik.errors}
              disabled={loading}
            />
            <VoiceSelectField
              value={formik.values.voice}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              touched={formik.touched}
              errors={formik.errors}
              disabled={loading}
            />
            <MessageInputField
              value={formik.values.message}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              touched={formik.touched}
              errors={formik.errors}
              disabled={loading}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <PhoneForwardedIcon />}
              sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
            >
              {loading ? 'Calling...' : 'Make Call'}
            </Button>
          </Box>
        </form>
        {result && (
          <CallResultAlert
            success={result.success}
            message={result.message}
            data={result.data}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default MakeCallForm;
