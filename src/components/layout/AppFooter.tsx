import type React from 'react';

const socialLinkClassName =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/50';

const GitHubIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2C6.477 2 2 6.59 2 12.253c0 4.53 2.865 8.369 6.839 9.727.5.095.683-.222.683-.494 0-.244-.009-.89-.014-1.747-2.782.62-3.369-1.375-3.369-1.375-.455-1.185-1.11-1.5-1.11-1.5-.909-.636.068-.623.068-.623 1.004.073 1.532 1.057 1.532 1.057.893 1.568 2.342 1.116 2.913.853.091-.663.35-1.116.636-1.372-2.221-.259-4.556-1.139-4.556-5.067 0-1.12.39-2.035 1.029-2.752-.103-.259-.446-1.303.098-2.714 0 0 .84-.276 2.75 1.052A9.405 9.405 0 0 1 12 6.952c.85.004 1.705.118 2.504.346 1.909-1.328 2.747-1.052 2.747-1.052.546 1.411.203 2.455.1 2.714.64.717 1.028 1.632 1.028 2.752 0 3.938-2.339 4.805-4.567 5.06.359.317.679.944.679 1.902 0 1.372-.013 2.479-.013 2.815 0 .274.18.594.688.493C19.138 20.618 22 16.781 22 12.253 22 6.59 17.523 2 12 2Z" />
  </svg>
);

const XIcon = () => (
  <svg
    className="h-3.5 w-3.5"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.966 6.817H1.68l7.73-8.836L1.254 2.25h6.826l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
  </svg>
);

export const AppFooter: React.FC = () => (
  <footer className="shrink-0 flex items-center justify-center gap-3 border-t border-foreground/10 bg-background/80 px-4 py-2 backdrop-blur-md">
    <a
      href="https://github.com/shinnodua/call3"
      target="_blank"
      rel="noreferrer"
      aria-label="Open Call3.dev on GitHub"
      className={socialLinkClassName}
    >
      <GitHubIcon />
      <span className="sr-only">GitHub</span>
    </a>
    <a
      href="https://x.com/call3_dev"
      target="_blank"
      rel="noreferrer"
      aria-label="Open Call3.dev on X"
      className={socialLinkClassName}
    >
      <XIcon />
      <span className="sr-only">X</span>
    </a>
  </footer>
);
