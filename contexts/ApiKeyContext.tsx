import React, { createContext, useContext, useState, useEffect } from 'react';

interface ApiKeyContextType {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  removeApiKey: () => void;
  isUsingEnv: boolean; // True if using process.env.API_KEY
  isConfigured: boolean; // True if we have a usable key
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isUsingEnv, setIsUsingEnv] = useState(false);

  useEffect(() => {
    // 1. Check for Environment Variable first (Vercel / Build time)
    // Note: In some build setups, process.env.API_KEY might be an empty string if not set, so we check for length.
    const envKey = process.env.API_KEY;

    if (envKey && envKey.length > 0 && !envKey.startsWith('YOUR_')) {
      setApiKeyState(envKey);
      setIsUsingEnv(true);
    } else {
      // 2. Fallback to LocalStorage
      const storedKey = localStorage.getItem('user_gemini_api_key');
      if (storedKey) {
        setApiKeyState(storedKey);
        setIsUsingEnv(false);
      }
    }
  }, []);

  const setApiKey = (key: string) => {
    if (!key.trim()) return;
    setApiKeyState(key);
    setIsUsingEnv(false);
    localStorage.setItem('user_gemini_api_key', key);
  };

  const removeApiKey = () => {
    setApiKeyState(null);
    setIsUsingEnv(false);
    localStorage.removeItem('user_gemini_api_key');
    
    // If env exists, it will naturally come back on refresh, 
    // but for current session we clear it to allow "Override" logic if needed.
    // However, usually we just want to clear the custom user key.
    
    // Re-check env var immediately for fallback
    const envKey = process.env.API_KEY;
    if (envKey && envKey.length > 0 && !envKey.startsWith('YOUR_')) {
        setApiKeyState(envKey);
        setIsUsingEnv(true);
    }
  };

  return (
    <ApiKeyContext.Provider value={{ 
      apiKey, 
      setApiKey, 
      removeApiKey, 
      isUsingEnv,
      isConfigured: !!apiKey 
    }}>
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = () => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};