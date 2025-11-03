
import React, { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import { askChatbot, getQuickResponse } from '../services/geminiService';
import type { ChatMessage, GroundingChunk } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import Spinner from './common/Spinner';
import { IconPaperPlane, IconSparkles } from './common/Icon';

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Assalamu\'alaikum! Ada yang bisa saya bantu terkait studi bahasa Arab atau Islam hari ini?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const { text, chunks } = await askChatbot(input, messages);
      const modelMessage: ChatMessage = { role: 'model', text, chunks };
      setMessages(prev => [...prev, modelMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickResponse = async () => {
      if (!input.trim() || isLoading) return;
      
      const prompt = `Berikan definisi atau terjemahan yang sangat singkat dan cepat untuk: "${input}"`;
      const userMessage: ChatMessage = { role: 'user', text: input };
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);
      setError(null);

      try {
          const responseText = await getQuickResponse(prompt);
          const modelMessage: ChatMessage = { role: 'model', text: responseText };
          setMessages(prev => [...prev, modelMessage]);
      } catch(err) {
           setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
          setIsLoading(false);
      }
  }

  const GroundingSources: React.FC<{ chunks?: GroundingChunk[] }> = ({ chunks }) => {
    if (!chunks || chunks.length === 0) return null;
    const webChunks = chunks.filter(c => c.web);
    if (webChunks.length === 0) return null;
    
    return (
      <div className="mt-2 text-xs text-stone-500">
        <h4 className="font-semibold">Sumber:</h4>
        <ul className="list-disc list-inside">
          {webChunks.map((chunk, index) => (
            <li key={index}>
              <a href={chunk.web!.uri} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">
                {chunk.web!.title || 'Tautan sumber'}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  };
  
  const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    // Sanitize the HTML to prevent XSS attacks if needed, but for internal AI, it's generally safe.
    // For production apps with user input, use a sanitizer like DOMPurify.
    const rawMarkup = marked(content, { gfm: true, breaks: true, smartypants: true });
    return <div className="markdown-content" dangerouslySetInnerHTML={{ __html: rawMarkup as string }} />;
  };

  return (
    <div className="p-4 md:p-8 flex flex-col h-[80vh]">
      <div className="flex-grow overflow-y-auto pr-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-lg px-4 py-3 rounded-2xl shadow ${
                msg.role === 'user'
                  ? 'bg-amber-500 text-white rounded-br-none'
                  : 'bg-white text-stone-800 rounded-bl-none'
              }`}
            >
              {msg.role === 'model' ? (
                <>
                  <MarkdownRenderer content={msg.text} />
                  <GroundingSources chunks={msg.chunks} />
                </>
              ) : (
                <p className="whitespace-pre-wrap">{msg.text}</p>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="max-w-lg px-4 py-3 rounded-2xl shadow bg-white text-stone-800 rounded-bl-none">
                <Spinner />
             </div>
          </div>
        )}
        {error && <div className="text-red-500 text-center">{error}</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="mt-6">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanyakan apa saja tentang bahasa Arab..."
            className="flex-grow p-3 border border-stone-300 rounded-full shadow-inner bg-stone-50 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()} variant="primary" className="rounded-full !p-3">
             <IconPaperPlane />
          </Button>
          <Button onClick={handleQuickResponse} disabled={isLoading || !input.trim()} variant="secondary" className="rounded-full !p-3" title="Dapatkan respons cepat">
             <IconSparkles />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;