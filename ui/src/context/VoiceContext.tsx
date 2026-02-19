import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { getVoiceLanguageCode } from '../tools/voices/voices.data';

interface VoiceContextValue {
  voice: string;
  language: string;
  setVoice: (voiceId: string) => void;
  setLanguage: (languageCode: string) => void;
}

const VoiceContext = createContext<VoiceContextValue>({
  voice: 'shubh',
  language: 'en-IN',
  setVoice: () => {},
  setLanguage: () => {},
});

export const useVoice = () => useContext(VoiceContext);

interface VoiceProviderProps {
  children: ReactNode;
}

export const VoiceProvider = ({ children }: VoiceProviderProps) => {
  const [voice, setVoiceState] = useState('shubh');
  const [language, setLanguage] = useState('en-IN');

  const setVoice = useCallback((voiceId: string) => {
    setVoiceState(voiceId);
    setLanguage(getVoiceLanguageCode(voiceId));
  }, []);

  return (
    <VoiceContext.Provider value={{ voice, language, setVoice, setLanguage }}>
      {children}
    </VoiceContext.Provider>
  );
};

export default VoiceContext;
