import React from 'react';
import { useARManager } from '@/hooks/useARManager';
import ARUI from '@/components/AR/ARUI';

const ARPage = () => {
  const manager = useARManager();
  return <ARUI manager={manager} />;
};

export default ARPage; 