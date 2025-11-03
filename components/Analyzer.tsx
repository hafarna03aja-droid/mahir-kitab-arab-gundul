import React, { useState, useEffect } from 'react';
import { analyzeText, generateSampleText, generateSpeech } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import type { AnalysisResult } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import Spinner from './common/Spinner';
import { IconSpeaker, IconFileText, IconFileDoc, IconTrash } from './common/Icon';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle } from 'docx';

const sampleTopics = [
  { title: 'Basmalah', text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' },
  { title: 'Hadis Niat', text: 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ' },
  { title: 'Peribahasa Arab', text: 'مَنْ جَدَّ وَجَدَ' }
];

interface HistoryItem extends AnalysisResult {
  analyzedAt: string;
}

const HISTORY_KEY = 'mahir-kitab-gundul-analysis-history';

const Analyzer: React.FC = () => {
  const [text, setText] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<HistoryItem[]>([]);

  // Load history from localStorage on initial component mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        setAnalysisHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Gagal memuat riwayat dari localStorage:", error);
      // If data is corrupted, clear it
      localStorage.removeItem(HISTORY_KEY);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(analysisHistory));
    } catch (error) {
      console.error("Gagal menyimpan riwayat ke localStorage:", error);
    }
  }, [analysisHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const analysisResult = await analyzeText(text);
      setResult(analysisResult);
      
      const newHistoryItem: HistoryItem = {
        ...analysisResult,
        analyzedAt: new Date().toISOString(),
      };
      // Add new item to history and keep only the last 5 items
      setAnalysisHistory(prev => [newHistoryItem, ...prev].slice(0, 5));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSample = async () => {
    if (!customTopic.trim()) return;
    setIsGeneratingSample(true);
    setError(null);
    try {
      const generatedText = await generateSampleText(customTopic);
      setText(generatedText);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat contoh teks.');
    } finally {
      setIsGeneratingSample(false);
    }
  };

  const handleLoadFromHistory = (item: HistoryItem) => {
    setResult(item);
    setError(null);
    const resultElement = document.getElementById('result-display');
    resultElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleClearHistory = () => {
    setAnalysisHistory([]);
    setResult(null); // Optionally clear the current view as well
  };
  
  const ResultDisplay: React.FC<{ result: AnalysisResult }> = ({ result }) => {
    const [isTtsLoading, setIsTtsLoading] = useState(false);

    const handlePlayAudio = async (textToSpeak: string) => {
        setIsTtsLoading(true);
        setError(null);
        try {
            const base64Audio = await generateSpeech(textToSpeak);
            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                outputAudioContext,
                24000,
                1
            );
            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputAudioContext.destination);
            source.start();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal memutar audio.');
        } finally {
            setIsTtsLoading(false);
        }
    };

    const handleExportTxt = () => {
      let content = `Analisis Teks Arab - Dibuat oleh Mahir Kitab Gundul\n\n`;
      content += `================================\n`;
      content += `TEKS ASLI\n`;
      content += `================================\n`;
      content += `${result.originalText}\n\n`;
      
      content += `================================\n`;
      content += `TEKS BERVOKALISASI (HARAKAT)\n`;
      content += `================================\n`;
      content += `${result.vocalizedText}\n\n`;

      content += `================================\n`;
      content += `TERJEMAHAN\n`;
      content += `================================\n`;
      content += `${result.translation}\n\n`;

      content += `================================\n`;
      content += `ANALISIS GRAMATIKAL (I'rAB)\n`;
      content += `================================\n\n`;

      result.grammaticalAnalysis.forEach(item => {
        content += `Kata: ${item.word}\n`;
        content += `Analisis: ${item.i_rab} (${item.i_rab_translation})\n`;
        content += `Terjemahan: ${item.translation}\n`;
        content += `--------------------------------\n`;
      });
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'analisis-teks-arab.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const handleExportDocx = async () => {
      const tableRows = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Terjemahan", bold: true })] })], width: { size: 30, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "الإعراب (Analisis)", bold: true })] })], width: { size: 40, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "الكلمة (Kata)", bold: true, rightToLeft: true })] })], width: { size: 30, type: WidthType.PERCENTAGE } }),
          ],
          tableHeader: true,
        }),
        ...result.grammaticalAnalysis.map(item => new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(item.translation)] }),
            new TableCell({ children: [
                new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: item.i_rab, rightToLeft: true, bold: true })] }),
                new Paragraph({ children: [new TextRun({ text: item.i_rab_translation, italics: true })] }),
            ]}),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: item.word, rightToLeft: true, font: "Calibri", size: 28 })] })] }),
          ]
        }))
      ];

      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({ text: "Teks Asli", heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: result.originalText, rightToLeft: true, font: "Calibri", size: 28 })] }),
            new Paragraph({ text: "Teks Bervokalisasi (Harakat)", heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: result.vocalizedText, rightToLeft: true, font: "Calibri", size: 28 })] }),
            new Paragraph({ text: "Terjemahan", heading: HeadingLevel.HEADING_1 }),
            new Paragraph(result.translation),
            new Paragraph({ text: "Analisis Gramatikal (I'rab)", heading: HeadingLevel.HEADING_1 }),
            new Table({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE },
                columnWidths: [3000, 4000, 3000],
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'analisis-teks-arab.docx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };


    return (
        <div className="space-y-6 mt-6">
        <Card>
            <h3 className="text-xl font-semibold text-stone-700 border-b pb-2 mb-3">Teks Asli</h3>
            <p className="text-lg text-right font-arabic" dir="rtl">{result.originalText}</p>
        </Card>
        <Card>
            <div className="flex justify-between items-center border-b pb-2 mb-3">
                <h3 className="text-xl font-semibold text-stone-700">Teks Bervokalisasi (Harakat)</h3>
                <button
                    onClick={() => handlePlayAudio(result.vocalizedText)}
                    disabled={isTtsLoading}
                    className="p-2 rounded-full hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-wait"
                    aria-label="Dengarkan teks"
                    title="Dengarkan Teks"
                >
                    {isTtsLoading ? <Spinner /> : <IconSpeaker className="h-6 w-6 text-stone-600" />}
                </button>
            </div>
            <p className="text-lg text-right font-arabic" dir="rtl">{result.vocalizedText}</p>
        </Card>
        <Card>
            <h3 className="text-xl font-semibold text-stone-700 border-b pb-2 mb-3">Terjemahan</h3>
            <p className="text-stone-800">{result.translation}</p>
        </Card>
        <Card>
            <h3 className="text-xl font-semibold text-stone-700 border-b pb-2 mb-3">Analisis Gramatikal (I'rab)</h3>
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                <tr>
                    <th className="border-b-2 border-stone-300 p-3 text-lg font-arabic text-right">الكلمة (Kata)</th>
                    <th className="border-b-2 border-stone-300 p-3 text-left">الإعراب (Analisis)</th>
                    <th className="border-b-2 border-stone-300 p-3 text-left">Terjemahan</th>
                </tr>
                </thead>
                <tbody>
                {result.grammaticalAnalysis.map((item, index) => (
                    <tr key={index} className="hover:bg-stone-50">
                    <td className="border-b border-stone-200 p-3 text-lg font-arabic text-right align-top" dir="rtl">{item.word}</td>
                    <td className="border-b border-stone-200 p-3 align-top">
                        <span className="font-arabic font-semibold text-stone-800" dir="rtl">{item.i_rab}</span>
                        <p className="text-sm text-stone-600 mt-1">{item.i_rab_translation}</p>
                    </td>
                    <td className="border-b border-stone-200 p-3 align-top">{item.translation}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </Card>
        <Card>
            <h3 className="text-xl font-semibold text-stone-700 mb-3">Opsi Ekspor</h3>
            <div className="flex gap-4">
                <Button onClick={handleExportTxt} variant="secondary">
                    <IconFileText />
                    Ekspor ke TXT
                </Button>
                <Button onClick={handleExportDocx} variant="secondary">
                    <IconFileDoc />
                    Ekspor ke DOCX
                </Button>
            </div>
        </Card>
        </div>
    );
    };

  return (
    <div className="p-4 md:p-8">
      <Card className="mb-6">
        <h2 className="text-2xl font-bold text-stone-800 mb-4">Penganalisis Teks Arab</h2>
        <p className="text-stone-600 mb-4">
          Masukkan teks Arab (dengan atau tanpa harakat) di bawah ini untuk mendapatkan analisis gramatikal (I'rab) yang mendalam, teks yang sudah divokalisasi, dan terjemahannya.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <p className="text-stone-600 mb-2 font-semibold">Pilih Contoh Teks atau Buat Sendiri:</p>
            <div className="flex flex-wrap gap-2">
              {sampleTopics.map((topic) => (
                <Button 
                  key={topic.title} 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setText(topic.text)}
                  className="!px-3 !py-1 text-sm"
                  disabled={isGeneratingSample || isLoading}
                >
                  {topic.title}
                </Button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Atau masukkan topik (misal: Sabar)"
                className="flex-grow p-2 border border-stone-300 rounded-md shadow-inner bg-stone-50 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                disabled={isGeneratingSample || isLoading}
              />
              <Button 
                type="button" 
                variant="secondary" 
                onClick={handleGenerateSample}
                disabled={isGeneratingSample || !customTopic.trim() || isLoading}
                className="!px-3 !py-1"
              >
                {isGeneratingSample ? <Spinner /> : 'Buat Contoh'}
              </Button>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="...اكتب النص العربي هنا أو اختر dari contoh di atas"
            className="w-full h-40 p-3 border border-stone-300 rounded-md shadow-inner bg-stone-50 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-right font-arabic text-lg"
            dir="rtl"
            disabled={isLoading || isGeneratingSample}
          />
          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={isLoading || !text.trim() || isGeneratingSample}>
              {isLoading ? <><Spinner /> Menganalisis...</> : 'Analisis Teks'}
            </Button>
          </div>
        </form>
      </Card>
      
      {analysisHistory.length > 0 && (
        <Card className="mb-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-stone-700">Riwayat Analisis</h2>
                <Button onClick={handleClearHistory} variant="secondary" className="!px-3 !py-1 text-sm">
                    <IconTrash className="h-4 w-4" />
                    <span>Bersihkan</span>
                </Button>
            </div>
            <ul className="space-y-2">
            {analysisHistory.map((item, index) => (
              <li
                key={index}
                onClick={() => handleLoadFromHistory(item)}
                className="p-3 rounded-md hover:bg-stone-50 cursor-pointer border border-stone-200 transition-colors"
                title="Muat ulang analisis ini"
              >
                <p className="font-arabic text-right truncate" dir="rtl">{item.originalText}</p>
                <span className="text-xs text-stone-500">
                  {new Date(item.analyzedAt).toLocaleString('id-ID', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {error && <div className="text-red-500 text-center p-4 bg-red-100 rounded-md">{error}</div>}

      <div id="result-display">
        {result && <ResultDisplay result={result} />}
      </div>
    </div>
  );
};

export default Analyzer;