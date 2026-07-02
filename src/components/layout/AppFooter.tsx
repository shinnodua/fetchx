import type React from 'react';
import { useEffect, useState } from 'react';
import { GitHubIcon, XIcon } from '../../assets/svgs';
import {
  type DesktopDownloadPlatform,
  getDesktopDownloadUrl,
} from '../../services/api';
import {
  getDesktopDownloadDevicePlatform,
  isDesktopApp,
} from '../../services/platform';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

const socialLinkClassName =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/50';

export const AppFooter: React.FC = () => {
  const { toast } = useToast();
  const isDesktop = isDesktopApp();
  const [downloadingPlatform, setDownloadingPlatform] =
    useState<DesktopDownloadPlatform | null>(null);
  const [platform, setPlatform] = useState<'mac' | 'windows' | 'other'>(
    'other',
  );

  useEffect(() => {
    setPlatform(getDesktopDownloadDevicePlatform());
  }, []);

  const downloadDesktopApp = async (target: DesktopDownloadPlatform) => {
    setDownloadingPlatform(target);
    try {
      const downloadUrl = await getDesktopDownloadUrl(target);
      window.location.assign(downloadUrl);
    } catch (error) {
      toast({
        title: 'Desktop download unavailable',
        description:
          error instanceof Error ? error.message : 'Please try again later.',
        type: 'error',
      });
    } finally {
      setDownloadingPlatform(null);
    }
  };

  return (
    <footer className="shrink-0 flex items-center justify-between border-t border-foreground/10 bg-background/80 px-4 py-2 backdrop-blur-md">
      <div className="flex-1" />
      <div className="flex items-center justify-center gap-3 flex-1">
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
      </div>
      <div className="flex items-center justify-end gap-2 flex-1">
        {!isDesktop && (
          <>
            {platform === 'mac' && (
              <Button
                variant="glass"
                size="sm"
                className="h-7 px-3 text-[11px] rounded-lg border-foreground/10 text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                isLoading={downloadingPlatform === 'mac'}
                onClick={() => downloadDesktopApp('mac')}
              >
                Download MacOS App
              </Button>
            )}
            {platform === 'windows' && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-3 text-[11px] rounded-lg border-foreground/10 text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                isLoading={downloadingPlatform === 'windows'}
                onClick={() => downloadDesktopApp('windows')}
              >
                Download Windows App
              </Button>
            )}
          </>
        )}
      </div>
    </footer>
  );
};
