export interface GrammaticalAnalysisItem {
  word: string;
  i_rab: string; // The Arabic I'rab term
  i_rab_translation: string; // The Indonesian explanation of the I'rab
  translation: string; // The translation of the word itself
}

export interface AnalysisResult {
  originalText: string;
  vocalizedText: string;
  translation: string;
  grammaticalAnalysis: GrammaticalAnalysisItem[];
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  chunks?: GroundingChunk[];
}
