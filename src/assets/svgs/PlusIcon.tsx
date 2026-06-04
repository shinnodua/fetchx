import { iconProps, type SvgIconProps } from './types';

export const PlusIcon = ({ title, stroke, ...props }: SvgIconProps) => (
  <svg fill="none" viewBox="0 0 24 24" {...iconProps(title)} {...props}>
    <title>{title}</title>
    <path
      stroke={stroke ?? '#e11d48'}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={props.strokeWidth ?? 2}
      vectorEffect="non-scaling-stroke"
      d="M12 4v16m8-8H4"
    />
  </svg>
);
