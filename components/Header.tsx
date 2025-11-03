
import React from 'react';
import { IconSettings } from './common/Icon';

interface HeaderProps {
  onSettingsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSettingsClick }) => {
  return (
    <header className="bg-stone-800 p-4 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Empty div for spacing to keep title centered */}
        <div className="w-10"></div>
        
        <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-amber-400 font-arabic">ماهر الكتاب الجندل</h1>
            <p className="text-stone-300 mt-1 text-base md:text-lg">Pemandu Berbasis AI Anda untuk Menguasai Teks Arab</p>
        </div>
        
        <button
          onClick={onSettingsClick}
          className="p-2 rounded-full text-stone-300 hover:bg-stone-700 hover:text-white transition-colors"
          aria-label="Pengaturan"
          title="Pengaturan"
        >
          <IconSettings className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;
