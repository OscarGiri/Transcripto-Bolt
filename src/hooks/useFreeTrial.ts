import { useState, useEffect } from 'react';

const FREE_TRIAL_LIMIT = 5;
const STORAGE_KEY = 'transcripto_free_uses';

export const useFreeTrial = () => {
  const [freeUsesRemaining, setFreeUsesRemaining] = useState<number>(FREE_TRIAL_LIMIT);
  const [hasExceededLimit, setHasExceededLimit] = useState<boolean>(false);

  useEffect(() => {
    const storedUses = localStorage.getItem(STORAGE_KEY);
    const usedCount = storedUses ? parseInt(storedUses, 10) : 0;
    const remaining = Math.max(0, FREE_TRIAL_LIMIT - usedCount);
    
    setFreeUsesRemaining(remaining);
    setHasExceededLimit(remaining === 0);
  }, []);

  const consumeFreeTrial = () => {
    const storedUses = localStorage.getItem(STORAGE_KEY);
    const currentUses = storedUses ? parseInt(storedUses, 10) : 0;
    const newUses = currentUses + 1;
    
    localStorage.setItem(STORAGE_KEY, newUses.toString());
    
    const remaining = Math.max(0, FREE_TRIAL_LIMIT - newUses);
    setFreeUsesRemaining(remaining);
    setHasExceededLimit(remaining === 0);
    
    return remaining > 0;
  };

  const resetFreeTrial = () => {
    localStorage.removeItem(STORAGE_KEY);
    setFreeUsesRemaining(FREE_TRIAL_LIMIT);
    setHasExceededLimit(false);
  };

  return {
    freeUsesRemaining,
    hasExceededLimit,
    consumeFreeTrial,
    resetFreeTrial,
  };
};