import TextField from '@mui/material/TextField';
import { FormikErrors, FormikTouched } from 'formik';
import { MakeCallFormValues } from '../calls.validation';

interface MessageInputFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  touched: FormikTouched<MakeCallFormValues>;
  errors: FormikErrors<MakeCallFormValues>;
  disabled: boolean;
}

const MessageInputField = ({
  value,
  onChange,
  onBlur,
  touched,
  errors,
  disabled,
}: MessageInputFieldProps) => {
  return (
    <TextField
      fullWidth
      id="message"
      name="message"
      label="Message (Text-to-Speech)"
      placeholder="Enter a natural, conversational message..."
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      error={touched.message && Boolean(errors.message)}
      helperText={
        (touched.message && errors.message) ||
        'AI will speak this message naturally with proper pauses and intonation. Use punctuation for natural pauses!'
      }
      disabled={disabled}
      multiline
      rows={4}
    />
  );
};

export default MessageInputField;
