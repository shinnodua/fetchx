import { iconProps, type SvgIconProps } from './types';

export const ChevronDownIcon = ({ title, stroke, ...props }: SvgIconProps) => (
  <svg fill="none" viewBox="0 0 24 24" {...iconProps(title)} {...props}>
    <title>{title}</title>
    <path
      stroke={stroke ?? 'currentColor'}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={props.strokeWidth ?? 2}
      vectorEffect="non-scaling-stroke"
      d="M19 9l-7 7-7-7"
    />
  </svg>
);
