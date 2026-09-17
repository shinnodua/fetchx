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
  openBrowserDownloadWindow,
} from '../../services/platform';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

const socialLinkClassName =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/50';
export const desktopDownloadButtonClassName =
  'relative z-10 h-10 min-h-10 px-4 text-sm leading-none rounded-lg border-foreground/10 text-foreground/70 hover:bg-foreground/5 hover:text-foreground';

export const AppFooter: React.FC = () => {
  const { toast } = useToast();
  const isDesktop = isDesktopApp();
  const [downloadingPlatform, setDownloadingPlatform] =
    useState<DesktopDownloadPlatform | null>(null);
  const [platform, setPlatform] = useState<'mac' | 'windows' | 'other'>(
    getDesktopDownloadDevicePlatform,
  );

  useEffect(() => {
    setPlatform(getDesktopDownloadDevicePlatform());
  }, []);

  const downloadDesktopApp = async (target: DesktopDownloadPlatform) => {
    let downloadWindow: Window;
    try {
      downloadWindow = openBrowserDownloadWindow();
    } catch (error) {
      toast({
        title: 'Desktop download unavailable',
        description:
          error instanceof Error ? error.message : 'Please try again later.',
        type: 'error',
      });
      return;
    }

    setDownloadingPlatform(target);
    try {
      const downloadUrl = await getDesktopDownloadUrl(target);
      downloadWindow.location.assign(downloadUrl);
    } catch (error) {
      downloadWindow.close();
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
    <footer className="relative z-50 shrink-0 flex items-center justify-between border-t border-foreground/10 bg-background/80 px-4 py-2 backdrop-blur-md">
      <div className="flex-1" />
      <div className="flex items-center justify-center gap-3 flex-1">
        <a
          href="https://github.com/shinnodua/fetchx"
          target="_blank"
          rel="noreferrer"
          aria-label="Open fetchx.dev on GitHub"
          className={socialLinkClassName}
        >
          <GitHubIcon title="GitHub icon" className="h-4 w-4" />
          <span className="sr-only">GitHub</span>
        </a>
        <a
          href="https://x.com/fetchx_dev"
          target="_blank"
          rel="noreferrer"
          aria-label="Open fetchx.dev on X"
          className={socialLinkClassName}
        >
          <XIcon title="X icon" className="h-3.5 w-3.5" />
          <span className="sr-only">X</span>
        </a>
      </div>
      <div className="relative z-10 flex flex-1 items-center justify-end gap-2">
        {!isDesktop && (
          <>
            {platform === 'mac' && (
              <Button
                variant="glass"
                size="sm"
                className={desktopDownloadButtonClassName}
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
                className={desktopDownloadButtonClassName}
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
