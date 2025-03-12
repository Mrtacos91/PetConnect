import React from 'react';
import Carnet from '../components/Carnet';
import ThemeToggle from '../components/ThemeToggle';

const CarnetPage: React.FC = () => {
  return (
    <div>
      <Carnet />
      <ThemeToggle />

    </div>
  );
};

export default CarnetPage;