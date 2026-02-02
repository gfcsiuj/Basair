import React from 'react';
import type { AppContextType } from './types';

export const AppContext = React.createContext<AppContextType | null>(null);
