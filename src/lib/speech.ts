export function speakDutch(text: string, voiceURI?: string, onError?: () => void) {
  if (!('speechSynthesis' in window)) {
    return false;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  utterance.lang = 'nl-NL';
  utterance.rate = 0.92;

  const selectedVoice =
    voices.find((voice) => voice.voiceURI === voiceURI) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith('nl'));

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.onerror = (event) => {
    if (event.error !== 'interrupted' && event.error !== 'canceled') onError?.();
  };

  window.speechSynthesis.speak(utterance);
  return true;
}
