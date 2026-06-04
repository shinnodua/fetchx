import { iconProps, type SvgIconProps } from './types';

export const EyeOffIcon = ({ title, ...props }: SvgIconProps) => (
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
      d="m3 3 18 18"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={props.strokeWidth ?? 1.5}
      vectorEffect="non-scaling-stroke"
      d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={props.strokeWidth ?? 1.5}
      vectorEffect="non-scaling-stroke"
      d="M9.88 5.5A9.8 9.8 0 0 1 12 5.25c6 0 9.75 6.75 9.75 6.75a18.1 18.1 0 0 1-3.19 3.95"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={props.strokeWidth ?? 1.5}
      vectorEffect="non-scaling-stroke"
      d="M6.6 6.6C3.79 8.34 2.25 12 2.25 12s3.75 6.75 9.75 6.75a9.8 9.8 0 0 0 4.03-.9"
    />
  </svg>
);
