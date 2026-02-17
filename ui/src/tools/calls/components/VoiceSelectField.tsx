import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { FormikErrors, FormikTouched } from 'formik';
import { MakeCallFormValues, voiceOptions } from '../calls.validation';

interface VoiceSelectFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  touched: FormikTouched<MakeCallFormValues>;
  errors: FormikErrors<MakeCallFormValues>;
  disabled: boolean;
}

const VoiceSelectField = ({
  value,
  onChange,
  onBlur,
  touched,
  errors,
  disabled,
}: VoiceSelectFieldProps) => {
  return (
    <TextField
      fullWidth
      select
      id="voice"
      name="voice"
      label="Voice (AI Neural)"
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      error={touched.voice && Boolean(errors.voice)}
      helperText={
        (touched.voice && errors.voice) ||
        'Select a natural-sounding neural voice powered by Amazon Polly AI'
      }
      disabled={disabled}
    >
      {voiceOptions.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
};

export default VoiceSelectField;
