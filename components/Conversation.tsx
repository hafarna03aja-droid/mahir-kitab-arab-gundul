
import React, { useState, useRef, useEffect } from 'react';
import { useLiveConversation, ConnectionState } from '../hooks/useLiveConversation';
import Button from './common/Button';
import Card from './common/Card';
import { IconMic, IconMicOff, IconPhoneOff, IconRecord, IconStop, IconAudioFile } from './common/Icon';

const Conversation: React.FC = () => {
  const {
    connectionState,
    startConversation,
    stopConversation,
    inputTranscription,
    outputTranscription,
    fullTranscript,
    errorMessage,
  } = useLiveConversation();

  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<{ url: string; date: Date }[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const isConversationActive = connectionState === ConnectionState.CONNECTING || connectionState === ConnectionState.CONNECTED;
  const isSessionActive = isConversationActive || isRecording;

  useEffect(() => {
    // Cleanup function to stop any active session when the component unmounts
    return () => {
      if (connectionState === ConnectionState.CONNECTED) {
        stopConversation();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [connectionState, stopConversation]);


  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const mimeType = recordedChunksRef.current[0]?.type || 'audio/webm';
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordings(prev => [...prev, { url, date: new Date() }]);
        recordedChunksRef.current = [];
        // Stop media tracks to turn off microphone indicator
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

    } catch (err) {
        console.error("Error starting recording:", err);
        alert("Tidak dapat memulai perekaman. Pastikan Anda telah memberikan izin mikrofon.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };


  const getStatusMessage = () => {
    if (isOfflineMode) {
      if (isRecording) return "Merekam... Ucapkan beberapa frasa dalam bahasa Arab.";
      return "Anda dalam mode latihan mandiri. Tekan 'Mulai Merekam' untuk merekam suara Anda.";
    }
    switch (connectionState) {
      case ConnectionState.IDLE:
        return "Tekan 'Mulai Tutor' untuk memulai latihan percakapan bahasa Arab Anda secara langsung.";
      case ConnectionState.CONNECTING:
        return "Menyambungkan ke tutor langsung... Mohon izinkan akses mikrofon.";
      case ConnectionState.CONNECTED:
        return "Terhubung! Mulai berbicara bahasa Arab sekarang. AI akan merespons secara real-time.";
      case ConnectionState.DISCONNECTED:
        return "Sesi berakhir. Tekan 'Mulai Tutor' untuk berlatih lagi.";
      case ConnectionState.ERROR:
        return errorMessage || "Terjadi kesalahan. Silakan periksa konsol dan coba lagi.";
      default:
        return "Selamat datang di Tutor Bahasa Arab Langsung.";
    }
  };

  const OnlineTutor = () => (
    <>
      <div className="flex justify-center gap-4 mb-8">
        {!isConversationActive ? (
          <Button onClick={startConversation} variant="primary" className="!px-8 !py-4 text-lg">
            <IconMic />
            Mulai Tutor
          </Button>
        ) : (
          <Button onClick={stopConversation} variant="danger" className="!px-8 !py-4 text-lg">
            <IconPhoneOff />
            Akhiri Sesi
          </Button>
        )}
      </div>
      <div className="bg-stone-50 p-4 rounded-lg min-h-[300px] shadow-inner">
        <h3 className="text-lg font-semibold text-stone-700 mb-4 border-b pb-2">Transkrip Percakapan</h3>
        <div className="space-y-4 text-lg">
          {fullTranscript.map((turn, index) => (
            <div key={index}>
              <p><span className="font-bold text-amber-700">Anda:</span> {turn.user}</p>
              <p><span className="font-bold text-stone-700">Tutor:</span> {turn.model}</p>
            </div>
          ))}
          {isConversationActive && (
            <div>
              {inputTranscription && <p><span className="font-bold text-amber-700">Anda:</span> <span className="text-stone-500 italic">{inputTranscription}</span></p>}
              {outputTranscription && <p><span className="font-bold text-stone-700">Tutor:</span> <span className="text-stone-500 italic">{outputTranscription}</span></p>}
            </div>
          )}
          {!isConversationActive && fullTranscript.length === 0 && (
            <div className="text-center text-stone-500 pt-10">
              <IconMicOff className="mx-auto h-12 w-12 text-stone-400" />
              <p className="mt-2">Percakapan Anda akan muncul di sini.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const OfflinePractice = () => (
    <>
      <div className="flex justify-center gap-4 mb-8">
        {!isRecording ? (
          <Button onClick={handleStartRecording} variant="primary" className="!px-8 !py-4 text-lg">
            <IconRecord />
            Mulai Merekam
          </Button>
        ) : (
          <Button onClick={handleStopRecording} variant="danger" className="!px-8 !py-4 text-lg">
            <IconStop />
            Berhenti Merekam
          </Button>
        )}
      </div>
       <div className="bg-stone-50 p-4 rounded-lg min-h-[300px] shadow-inner">
        <h3 className="text-lg font-semibold text-stone-700 mb-4 border-b pb-2">Rekaman Anda</h3>
        {recordings.length > 0 ? (
          <ul className="space-y-3">
            {recordings.slice().reverse().map((rec, index) => (
              <li key={index} className="flex items-center justify-between p-3 bg-white rounded-md shadow-sm">
                <div className="flex items-center gap-3">
                    <IconAudioFile className="h-6 w-6 text-amber-600" />
                    <span className="font-semibold text-stone-700">Rekaman #{recordings.length - index}</span>
                    <span className="text-sm text-stone-500">{rec.date.toLocaleTimeString()}</span>
                </div>
                <audio controls src={rec.url} className="h-10"></audio>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-stone-500 pt-10">
            <IconMicOff className="mx-auto h-12 w-12 text-stone-400" />
            <p className="mt-2">Rekaman Anda akan muncul di sini.</p>
          </div>
        )}
       </div>
    </>
  );

  return (
    <div className="p-4 md:p-8">
      <Card>
        <h2 className="text-2xl font-bold text-stone-800 mb-2">Tutor Bahasa Arab Langsung</h2>
        
        <div className="flex items-center justify-center mb-6 py-2">
            <span className={`font-semibold transition-colors ${!isOfflineMode ? 'text-amber-700' : 'text-stone-500'}`}>Tutor Langsung (Online)</span>
            <label className="relative inline-flex items-center cursor-pointer mx-4">
                <input 
                    type="checkbox" 
                    checked={isOfflineMode} 
                    onChange={() => setIsOfflineMode(!isOfflineMode)} 
                    className="sr-only peer" 
                    disabled={isSessionActive}
                />
                <div className={`w-11 h-6 rounded-full peer transition-colors ${isSessionActive ? 'bg-stone-100' : 'bg-stone-200 peer-checked:bg-amber-600'} peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-400 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
            </label>
            <span className={`font-semibold transition-colors ${isOfflineMode ? 'text-amber-700' : 'text-stone-500'}`}>Latihan Mandiri (Offline)</span>
        </div>

        <div className={`p-4 rounded-md mb-6 text-center transition-colors ${
             connectionState === ConnectionState.ERROR ? 'bg-red-100 text-red-800' :
             connectionState === ConnectionState.CONNECTED || isRecording ? 'bg-green-100 text-green-800' : 
             'bg-amber-100 text-amber-800'
        }`}>
            <p className="font-semibold">{getStatusMessage()}</p>
        </div>

        {isOfflineMode ? <OfflinePractice /> : <OnlineTutor />}
        
      </Card>
    </div>
  );
};

export default Conversation;
