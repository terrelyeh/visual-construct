import React, { createContext, useContext, useState, useEffect } from 'react';

interface ApiKeyContextType {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  removeApiKey: () => void;
  isUsingEnv: boolean; // True if using process.env.API_KEY
  isConfigured: boolean; // True if we have a usable key
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

// Helper to safely access env var without crashing in browser if process is undefined
const getEnvApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // Ignore reference errors
  }
  return null;
};

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isUsingEnv, setIsUsingEnv] = useState(false);

  useEffect(() => {
    // 1. Check for Environment Variable first (Vercel / Build time)
    const envKey = getEnvApiKey();

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
    
    // Re-check env var immediately for fallback
    const envKey = getEnvApiKey();
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