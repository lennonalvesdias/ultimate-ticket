import React from 'react';
import './Container.css';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'small' | 'medium' | 'large' | 'fluid';
  padding?: boolean;
}

const Container: React.FC<ContainerProps> = ({
  children,
  className = '',
  size = 'medium',
  padding = true
}) => {
  const classes = [
    'container',
    `container--${size}`,
    padding && 'container--padding',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
};

export default Container; 