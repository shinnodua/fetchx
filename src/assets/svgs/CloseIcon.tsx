import { iconProps, type SvgIconProps } from './types';

export const CloseIcon = ({ title, ...props }: SvgIconProps) => (
  <svg
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    {...iconProps(title)}
    {...props}
  >
    <title>{title}</title>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={props.strokeWidth ?? 1.5}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);
