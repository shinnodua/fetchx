import { iconProps, type SvgIconProps } from './types';

export const CopyIcon = ({ title, stroke, ...props }: SvgIconProps) => (
  <svg fill="none" viewBox="0 0 24 24" {...iconProps(title)} {...props}>
    <title>{title}</title>
    <path
      stroke={stroke ?? 'currentColor'}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={props.strokeWidth ?? 1.5}
      vectorEffect="non-scaling-stroke"
      d="M8 8.5A2.5 2.5 0 0110.5 6h6A2.5 2.5 0 0119 8.5v6a2.5 2.5 0 01-2.5 2.5h-6A2.5 2.5 0 018 14.5v-6z"
    />
    <path
      stroke={stroke ?? 'currentColor'}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={props.strokeWidth ?? 1.5}
      vectorEffect="non-scaling-stroke"
      d="M15 20H7.5A2.5 2.5 0 015 17.5V10"
    />
  </svg>
);
