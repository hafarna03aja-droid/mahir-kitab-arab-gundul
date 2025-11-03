
import React, { useState, useEffect } from 'react';
import Button from './common/Button';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const API_KEY_LOCAL_STORAGE = 'gemini-api-key';

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave }) => {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      const savedKey = localStorage.getItem(API_KEY_LOCAL_STORAGE) || '';
      setApiKey(savedKey);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem(API_KEY_LOCAL_STORAGE, apiKey.trim());
      onSave();
    }
  };
  
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 transition-opacity"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-2xl p-8 m-4 max-w-md w-full text-stone-800 transform transition-all scale-100">
        <h2 className="text-2xl font-bold mb-4">Pengaturan Kunci API Gemini</h2>
        <p className="text-stone-600 mb-6">
          Silakan masukkan kunci API Google Gemini Anda. Kunci Anda akan disimpan dengan aman di browser Anda dan tidak akan dibagikan ke mana pun.
        </p>
        <div className="mb-4">
          <label htmlFor="apiKey" className="block text-sm font-medium text-stone-700 mb-2">
            Kunci API Anda
          </label>
          <input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full p-2 border border-stone-300 rounded-md shadow-inner bg-stone-50 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
            placeholder="Masukkan kunci API Anda di sini"
          />
        </div>
        <p className="text-xs text-stone-500 mb-6">
            Anda bisa mendapatkan kunci API Anda dari{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">
                Google AI Studio
            </a>.
        </p>
        <div className="flex justify-end gap-4">
          <Button onClick={onClose} variant="secondary">
            Batal
          </Button>
          <Button onClick={handleSave} variant="primary" disabled={!apiKey.trim()}>
            Simpan
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;