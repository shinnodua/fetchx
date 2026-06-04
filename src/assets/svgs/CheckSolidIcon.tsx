import { iconProps, type SvgIconProps } from './types';

export const CheckSolidIcon = ({ title, ...props }: SvgIconProps) => (
  <svg viewBox="0 0 20 20" fill="currentColor" {...iconProps(title)} {...props}>
    <title>{title}</title>
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);
