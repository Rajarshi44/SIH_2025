"use client";

import { ReactNode, ButtonHTMLAttributes, HTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) => {
  const baseStyles =
    "font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-neon text-dark-900 hover:bg-neon/90 hover:shadow-lg hover:shadow-neon/50",
    secondary:
      "bg-dark-700 text-white hover:bg-dark-600 border border-dark-600",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "bg-transparent text-neon border border-neon/30 hover:bg-neon/10",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glow?: boolean;
}

export const Card = ({
  children,
  className = "",
  glow = false,
  ...props
}: CardProps) => {
  return (
    <div
      className={`
        bg-dark-800 rounded-xl border border-dark-600 p-6 
        transition-all duration-300 hover:border-neon/30
        ${glow ? "animate-glow" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "neon";
  className?: string;
}

export const Badge = ({
  children,
  variant = "default",
  className = "",
}: BadgeProps) => {
  const variants = {
    default: "bg-dark-700 text-gray-300",
    success: "bg-green-500/20 text-green-400 border border-green-500/30",
    warning: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    danger: "bg-red-500/20 text-red-400 border border-red-500/30",
    neon: "bg-neon/20 text-neon border border-neon/30",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

interface ToggleProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  disabled?: boolean;
}

export const Toggle = ({
  checked,
  onChange,
  label,
  disabled = false,
}: ToggleProps) => {
  return (
    <label
      className={`flex items-center ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
    >
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
        <div
          className={`
          block w-14 h-8 rounded-full transition-all duration-300
          ${checked ? "bg-neon" : "bg-dark-600"}
          ${!disabled && "hover:opacity-90"}
        `}
        ></div>
        <div
          className={`
          absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-all duration-300 shadow-lg
          ${checked ? "translate-x-6" : "translate-x-0"}
        `}
        ></div>
      </div>
      {label && (
        <span className="ml-3 text-gray-300 font-medium select-none">
          {label}
        </span>
      )}
    </label>
  );
};

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  disabled?: boolean;
}

export const Slider = ({
  value,
  onChange,
  min = 0,
  max = 255,
  label,
  disabled = false,
}: SliderProps) => {
  const percentage = ((value - min) / (max - min)) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    onChange(newValue);
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const newValue = Number((e.target as HTMLInputElement).value);
    onChange(newValue);
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">{label}</label>
          <span className="text-sm font-bold text-neon">{value}</span>
        </div>
      )}
      <div className="relative py-2">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={handleChange}
          onInput={handleInput}
          disabled={disabled}
          className="slider w-full"
          aria-label={label || "slider"}
          style={{
            background: disabled
              ? "#232e3f"
              : `linear-gradient(to right, #B6FF00 0%, #B6FF00 ${percentage}%, #232e3f ${percentage}%, #232e3f 100%)`,
          }}
        />
      </div>
    </div>
  );
};

interface AlertProps {
  children: ReactNode;
  variant?: "info" | "success" | "warning" | "danger";
  onClose?: () => void;
  className?: string;
}

export const Alert = ({
  children,
  variant = "info",
  onClose,
  className = "",
}: AlertProps) => {
  const variants = {
    info: "bg-blue-500/20 border-blue-500/30 text-blue-300",
    success: "bg-green-500/20 border-green-500/30 text-green-300",
    warning: "bg-yellow-500/20 border-yellow-500/30 text-yellow-300",
    danger: "bg-red-500/20 border-red-500/30 text-red-300",
  };

  return (
    <div
      className={`p-4 rounded-lg border ${variants[variant]} ${className} relative`}
    >
      {children}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-current opacity-70 hover:opacity-100"
        >
          ✕
        </button>
      )}
    </div>
  );
};
