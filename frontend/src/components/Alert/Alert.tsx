import React from 'react';
import './Alert.css';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info';
  className?: string;
  closable?: boolean;
  onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'info',
  className = '',
  closable = false,
  onClose
}) => {
  const classes = [
    'alert',
    `alert--${variant}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className="alert__content">
        {children}
      </div>
      {closable && (
        <button
          className="alert__close"
          onClick={onClose}
          aria-label="Fechar"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Alert; 