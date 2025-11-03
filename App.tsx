
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Analyzer from './components/Analyzer';
import Chatbot from './components/Chatbot';
import Conversation from './components/Conversation';
import ApiKeyModal from './components/ApiKeyModal';
import { IconBook, IconChat, IconMic } from './components/common/Icon';

type Tab = 'analyzer' | 'chatbot' | 'conversation';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('analyzer');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<'saved' | 'idle'>('idle');

  useEffect(() => {
    // Check if the API key is set on initial load.
    const apiKey = localStorage.getItem('gemini-api-key');
    if (!apiKey) {
      setIsApiKeyModalOpen(true);
    }
  }, []);

  const handleApiKeySaved = () => {
    setIsApiKeyModalOpen(false);
    setApiKeyStatus('saved');
    setTimeout(() => setApiKeyStatus('idle'), 3000); // Hide message after 3 seconds
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'analyzer':
        return <Analyzer />;
      case 'chatbot':
        return <Chatbot />;
      case 'conversation':
        return <Conversation />;
      default:
        return <Analyzer />;
    }
  };

  const TabButton: React.FC<{ tabName: Tab; label: string; icon: React.ReactNode }> = ({ tabName, label, icon }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm md:text-base font-semibold transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-stone-800 rounded-t-lg ${
        activeTab === tabName
          ? 'bg-stone-100 text-stone-800 border-b-2 border-amber-500'
          : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="bg-stone-900 min-h-screen text-stone-100 flex flex-col">
      <Header onSettingsClick={() => setIsApiKeyModalOpen(true)} />
      
      {apiKeyStatus === 'saved' && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded-lg shadow-lg z-50 animate-fade-in-down">
          Kunci API berhasil disimpan!
        </div>
      )}

      <main className="flex-grow p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex border-b border-stone-700">
            <TabButton tabName="analyzer" label="Analisis" icon={<IconBook />} />
            <TabButton tabName="chatbot" label="Asisten AI" icon={<IconChat />} />
            <TabButton tabName="conversation" label="Tutor Langsung" icon={<IconMic />} />
          </div>
          <div className="bg-stone-100 text-stone-900 rounded-b-lg shadow-2xl mt-[-1px]">
            {renderContent()}
          </div>
        </div>
      </main>
      <footer className="text-center p-4 text-stone-500 text-sm">
        <p>Didukung oleh 24 Learning Centre</p>
      </footer>
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSave={handleApiKeySaved}
      />
    </div>
  );
};

export default App;