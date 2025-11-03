
import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAI_Blob, LiveSession } from "@google/genai";
import { getAiClient } from '../services/geminiService';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';

export enum ConnectionState {
  IDLE,
  CONNECTING,
  CONNECTED,
  DISCONNECTED,
  ERROR,
}

export const useLiveConversation = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.IDLE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inputTranscription, setInputTranscription] = useState<string>('');
  const [outputTranscription, setOutputTranscription] = useState<string>('');
  const [fullTranscript, setFullTranscript] = useState<{user: string, model: string}[]>([]);
  
  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // FIX: Refs to hold current transcriptions to avoid stale closures in callbacks.
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  const stopAudioPlayback = () => {
    audioSourcesRef.current.forEach(source => {
      source.stop();
    });
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };
  
  // FIX: Removed dependencies on inputTranscription and outputTranscription to prevent re-creation of the function on every transcription update, which caused stale closures.
  const startConversation = useCallback(async () => {
    setConnectionState(ConnectionState.CONNECTING);
    setErrorMessage(null);
    setInputTranscription('');
    setOutputTranscription('');
    setFullTranscript([]);
    // FIX: Reset refs on start.
    currentInputTranscriptionRef.current = '';
    currentOutputTranscriptionRef.current = '';

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Your browser does not support audio recording.");
        setConnectionState(ConnectionState.ERROR);
        setErrorMessage("Browser Anda tidak mendukung perekaman audio.");
        return;
      }
      
      const ai = getAiClient(); // Throws an error if the key is not set

      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setConnectionState(ConnectionState.CONNECTED);
            
            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            audioContextRef.current = inputAudioContext;
            
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            nextStartTimeRef.current = 0;

            const source = inputAudioContext.createMediaStreamSource(mediaStreamRef.current!);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              // FIX: Refactored blob creation to be more efficient and match guidelines.
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob: GenAI_Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                currentInputTranscriptionRef.current += text;
                setInputTranscription(prev => prev + text);
            }
            if (message.serverContent?.outputTranscription) {
                const text = message.serverContent.outputTranscription.text;
                currentOutputTranscriptionRef.current += text;
                setOutputTranscription(prev => prev + text);
            }
             if (message.serverContent?.turnComplete) {
                // FIX: Use refs to get the latest transcription value and avoid stale state.
                const fullInput = currentInputTranscriptionRef.current;
                const fullOutput = currentOutputTranscriptionRef.current;
                
                if (fullInput || fullOutput) {
                  setFullTranscript(prev => [...prev, { user: fullInput, model: fullOutput }]);
                }
                
                // FIX: Reset refs and state for the next turn.
                setInputTranscription('');
                setOutputTranscription('');
                currentInputTranscriptionRef.current = '';
                currentOutputTranscriptionRef.current = '';
            }
            if (message.serverContent?.interrupted) {
              stopAudioPlayback();
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const outputAudioContext = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContext.destination);

              source.addEventListener('ended', () => {
                audioSourcesRef.current.delete(source);
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              audioSourcesRef.current.add(source);
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error("Live session error:", e);
            setErrorMessage("Koneksi ke tutor langsung gagal.");
            setConnectionState(ConnectionState.ERROR);
          },
          onclose: () => {
            setConnectionState(ConnectionState.DISCONNECTED);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: 'Anda adalah tutor yang ramah dan sabar untuk bahasa Arab klasik. Berinteraksilah dengan pengguna dalam bahasa Indonesia. Ajukan pertanyaan dalam bahasa Arab dan berikan umpan balik atau penjelasan dalam bahasa Indonesia untuk membantu pengguna melatih pengucapan dan pemahaman bahasa Arab mereka.',
        },
      });

    } catch (error) {
      console.error("Failed to start conversation:", error);
      setErrorMessage(error instanceof Error ? error.message : "Gagal memulai percakapan.");
      setConnectionState(ConnectionState.ERROR);
    }
  }, []);

  const stopConversation = useCallback(async () => {
    stopAudioPlayback();
    if (sessionPromiseRef.current) {
      const session = await sessionPromiseRef.current;
      session.close();
      sessionPromiseRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      await outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    setConnectionState(ConnectionState.IDLE);
  }, []);

  return {
    connectionState,
    startConversation,
    stopConversation,
    inputTranscription,
    outputTranscription,
    fullTranscript,
    errorMessage
  };
};
