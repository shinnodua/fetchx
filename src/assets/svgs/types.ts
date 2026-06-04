import type React from 'react';

export type SvgIconProps = React.SVGProps<SVGSVGElement> & {
  title: string;
};

export const iconProps = (title: string) => ({
  role: 'img',
  'aria-label': title,
});
