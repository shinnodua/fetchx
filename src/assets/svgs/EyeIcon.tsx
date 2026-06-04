import { iconProps, type SvgIconProps } from './types';

export const EyeIcon = ({ title, ...props }: SvgIconProps) => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    {...iconProps(title)}
    {...props}
  >
    <title>{title}</title>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={props.strokeWidth ?? 1.5}
      vectorEffect="non-scaling-stroke"
      d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12Z"
    />
    <circle
      cx="12"
      cy="12"
      r="2.75"
      strokeWidth={props.strokeWidth ?? 1.5}
      vectorEffect="non-scaling-stroke"
    />
  </svg>
);
