import { iconProps, type SvgIconProps } from './types';

export const ChatIcon = ({ title, stroke, ...props }: SvgIconProps) => (
  <svg fill="none" viewBox="0 0 24 24" {...iconProps(title)} {...props}>
    <title>{title}</title>
    <path
      stroke={stroke ?? 'currentColor'}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={props.strokeWidth ?? 1.5}
      vectorEffect="non-scaling-stroke"
      d="M4.5 6.75A3.25 3.25 0 0 1 7.75 3.5h8.5a3.25 3.25 0 0 1 3.25 3.25v5.5a3.25 3.25 0 0 1-3.25 3.25H11l-4.25 4v-4A3.25 3.25 0 0 1 4.5 12.25v-5.5Z"
    />
    <path
      stroke={stroke ?? 'currentColor'}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={props.strokeWidth ?? 1.5}
      vectorEffect="non-scaling-stroke"
      d="M8.5 8.25h7m-7 3h4.5"
    />
  </svg>
);
