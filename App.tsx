
import React, { useState } from 'react';
import Header from './components/Header';
import Analyzer from './components/Analyzer';
import Chatbot from './components/Chatbot';
import Conversation from './components/Conversation';
import { IconBook, IconChat, IconMic } from './components/common/Icon';

type Tab = 'analyzer' | 'chatbot' | 'conversation';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('analyzer');

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
      <Header />
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
    </div>
  );
};

export default App;