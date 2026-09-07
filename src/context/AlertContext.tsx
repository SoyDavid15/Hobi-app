import React, { createContext, useContext, useState, ReactNode } from 'react';
import { BottomAlert, AlertButton } from '@/components/bottom-alert';

interface AlertOptions {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  buttons?: AlertButton[];
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [alertState, setAlertState] = useState<AlertOptions>({
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (options: AlertOptions) => {
    setAlertState(options);
    setVisible(true);
  };

  const hideAlert = () => {
    setVisible(false);
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <BottomAlert
        visible={visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type || 'info'}
        buttons={alertState.buttons}
        onDismiss={hideAlert}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
