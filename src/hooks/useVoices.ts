import { useEffect, useMemo, useState } from 'react';

export function useVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      return;
    }

    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const dutchVoices = useMemo(
    () => voices.filter((voice) => voice.lang.toLowerCase().startsWith('nl')),
    [voices],
  );

  return {
    voices,
    dutchVoices,
    hasSpeech: typeof window !== 'undefined' && 'speechSynthesis' in window,
  };
}
