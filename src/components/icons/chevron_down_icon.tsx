import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const ChevronDownIcon: React.FC<IconProps> = ({ className = "", size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 15.375L6 9.375L7.4 7.975L12 12.575L16.6 7.975L18 9.375L12 15.375Z"
        fill="currentColor"
      />
    </svg>
  );
}; 