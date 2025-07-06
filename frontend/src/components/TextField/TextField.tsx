import React, { forwardRef } from 'react';
import InputMask from 'react-input-mask';
import './TextField.css';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  mask?: string;
  fullWidth?: boolean;
  variant?: 'outlined' | 'filled';
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(({
  label,
  error,
  helperText,
  mask,
  fullWidth = false,
  variant = 'outlined',
  className = '',
  ...props
}, ref) => {
  const classes = [
    'textfield',
    `textfield--${variant}`,
    fullWidth && 'textfield--full-width',
    error && 'textfield--error',
    className
  ].filter(Boolean).join(' ');

  const inputClasses = [
    'textfield__input',
    error && 'textfield__input--error'
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {label && (
        <label className="textfield__label">
          {label}
        </label>
      )}
      {mask ? (
        <InputMask
          mask={mask}
          className={inputClasses}
          value={props.value}
          onChange={props.onChange}
          placeholder={props.placeholder}
          disabled={props.disabled}
          readOnly={props.readOnly}
          name={props.name}
          id={props.id}
          type={props.type}
        />
      ) : (
        <input
          ref={ref}
          className={inputClasses}
          {...props}
        />
      )}
      {error && (
        <span className="textfield__error-message">
          {error}
        </span>
      )}
      {helperText && !error && (
        <span className="textfield__helper-text">
          {helperText}
        </span>
      )}
    </div>
  );
});

TextField.displayName = 'TextField';

export default TextField; 