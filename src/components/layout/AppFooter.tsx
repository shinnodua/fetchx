import type React from 'react';
import { GitHubIcon, XIcon } from '../../assets/svgs';

const socialLinkClassName =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/50';

export const AppFooter: React.FC = () => (
  <footer className="shrink-0 flex items-center justify-center gap-3 border-t border-foreground/10 bg-background/80 px-4 py-2 backdrop-blur-md">
    <a
      href="https://github.com/shinnodua/call3"
      target="_blank"
      rel="noreferrer"
      aria-label="Open Call3.dev on GitHub"
      className={socialLinkClassName}
    >
      <GitHubIcon title="GitHub icon" className="h-4 w-4" />
      <span className="sr-only">GitHub</span>
    </a>
    <a
      href="https://x.com/call3_dev"
      target="_blank"
      rel="noreferrer"
      aria-label="Open Call3.dev on X"
      className={socialLinkClassName}
    >
      <XIcon title="X icon" className="h-3.5 w-3.5" />
      <span className="sr-only">X</span>
    </a>
  </footer>
);
