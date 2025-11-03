
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-stone-800 p-4 shadow-md">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-amber-400 font-arabic">ماهر الكتاب الجندل</h1>
        <p className="text-stone-300 mt-1 text-lg">Pemandu Berbasis AI Anda untuk Menguasai Teks Arab</p>
      </div>
    </header>
  );
};

export default Header;
