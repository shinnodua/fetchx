import type React from 'react';
import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../../../assets/svgs';
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  useToast,
} from '../../../components';
import type { RequestItem } from '../types';
import {
  copyAsCurlBash,
  copyAsCurlCmd,
  copyAsCurlPowerShell,
  copyAsFetch,
  copyLinkAddress,
  copyRequestHeaders,
  copyResponse,
} from '../utils/requestExport';

interface TabContextMenuProps {
  tabId: string;
  x: number;
  y: number;
  request: RequestItem | null;
  tabs: string[];
  menuRef: React.RefObject<HTMLDivElement | null>;
  closeTab: (tabId: string) => void;
  closeTabWithPrompt: (tabId: string) => void;
  closeTabs: (tabIds: string[]) => void;
  closeTabsWithPrompt: (tabIds: string[]) => void;
  revealRequestInSidebar: (tabId: string) => void;
  onClose: () => void;
}

export const TabContextMenu: React.FC<TabContextMenuProps> = ({
  tabId,
  x,
  y,
  request,
  tabs,
  menuRef,
  closeTab,
  closeTabWithPrompt,
  closeTabs,
  closeTabsWithPrompt,
  revealRequestInSidebar,
  onClose,
}) => {
  const { toast } = useToast();
  const [showCopyOptions, setShowCopyOptions] = useState(false);
  const isHttp = request && (request.type === 'GET' || request.type === 'POST');

  const closeMenu = () => {
    setShowCopyOptions(false);
    onClose();
  };

  const runMenuAction = (action: () => void) => {
    action();
    closeMenu();
  };

  const handleCopy = async (type: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!request) return;

    let text = '';
    let label = '';

    switch (type) {
      case 'link':
        text = copyLinkAddress(request);
        label = 'Link address';
        break;
      case 'fetch':
        text = copyAsFetch(request);
        label = 'Fetch command';
        break;
      case 'curl-bash':
        text = copyAsCurlBash(request);
        label = 'cURL (bash) command';
        break;
      case 'curl-cmd':
        text = copyAsCurlCmd(request);
        label = 'cURL (cmd) command';
        break;
      case 'curl-power':
        text = copyAsCurlPowerShell(request);
        label = 'cURL (PowerShell) command';
        break;
      case 'headers':
        text = copyRequestHeaders(request);
        label = 'Request headers';
        break;
      case 'response':
        text = copyResponse(request);
        label = 'Response';
        if (!text) {
          toast({
            title: 'Copy Failed',
            description: 'No response data available to copy.',
            type: 'warning',
          });
          closeMenu();
          return;
        }
        break;
      default:
        break;
    }

    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied to Clipboard',
        description: `${label} copied successfully.`,
        type: 'success',
      });
    } catch {
      toast({
        title: 'Copy Failed',
        description: `Could not copy ${label.toLowerCase()} to clipboard.`,
        type: 'error',
      });
    }
    closeMenu();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[70] w-48 overflow-hidden rounded-xl border border-foreground/10 bg-background/95 p-1 shadow-xl backdrop-blur-xl"
      style={{ left: x, top: y }}
      onContextMenu={(event) => event.preventDefault()}
    >
      {showCopyOptions ? (
        <>
          <DropdownMenuItem
            onClick={(event) => {
              event.stopPropagation();
              setShowCopyOptions(false);
            }}
            className="font-medium text-foreground/60"
          >
            <ChevronLeftIcon title="Back icon" className="w-3.5 h-3.5 mr-2" />
            Back
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={(event) => handleCopy('link', event)}>
            Copy link address
          </DropdownMenuItem>
          {isHttp && (
            <>
              <DropdownMenuItem onClick={(event) => handleCopy('fetch', event)}>
                Copy as fetch
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(event) => handleCopy('curl-bash', event)}
              >
                Copy as cURL (bash)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(event) => handleCopy('curl-cmd', event)}
              >
                Copy as cURL (cmd)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(event) => handleCopy('curl-power', event)}
              >
                Copy as cURL (PowerShell)
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem onClick={(event) => handleCopy('headers', event)}>
            Copy request headers
          </DropdownMenuItem>
          {request?.response && (
            <DropdownMenuItem
              onClick={(event) => handleCopy('response', event)}
            >
              Copy response
            </DropdownMenuItem>
          )}
        </>
      ) : (
        <>
          <DropdownMenuItem
            onClick={() => runMenuAction(() => closeTabWithPrompt(tabId))}
          >
            Close Tab
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => runMenuAction(() => closeTab(tabId))}
          >
            Force Close Tab
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() =>
              runMenuAction(() =>
                closeTabsWithPrompt(tabs.filter((item) => item !== tabId)),
              )
            }
          >
            Close Other Tabs
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => runMenuAction(() => closeTabsWithPrompt(tabs))}
          >
            Close All Tabs
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => runMenuAction(() => closeTabs(tabs))}
          >
            Force Close All Tabs
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => runMenuAction(() => revealRequestInSidebar(tabId))}
          >
            Reveal in Sidebar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(event) => {
              event.stopPropagation();
              setShowCopyOptions(true);
            }}
            className="flex items-center justify-between hover:bg-foreground/5"
          >
            <span>Copy</span>
            <ChevronRightIcon
              title="Copy submenu"
              className="w-3.5 h-3.5 text-foreground/45"
            />
          </DropdownMenuItem>
        </>
      )}
    </div>
  );
};
