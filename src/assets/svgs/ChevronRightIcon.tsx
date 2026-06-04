import { iconProps, type SvgIconProps } from './types';

export const ChevronRightIcon = ({ title, ...props }: SvgIconProps) => (
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
      d="M9 5l7 7-7 7"
    />
  </svg>
);
