import { iconProps, type SvgIconProps } from './types';

export const ChevronRightIcon = ({ title, stroke, ...props }: SvgIconProps) => (
  <svg fill="none" viewBox="0 0 24 24" {...iconProps(title)} {...props}>
    <title>{title}</title>
    <path
      stroke={stroke ?? 'currentColor'}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={props.strokeWidth ?? 2}
      vectorEffect="non-scaling-stroke"
      d="M9 5l7 7-7 7"
    />
  </svg>
);
