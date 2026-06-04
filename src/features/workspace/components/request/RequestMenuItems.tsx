import type React from 'react';
import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../../../../assets/svgs';
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  useToast,
} from '../../../../components';
import { useWorkspaceStore } from '../../../../store';
import {
  copyAsCurlBash,
  copyAsCurlCmd,
  copyAsCurlPowerShell,
  copyAsFetch,
  copyLinkAddress,
  copyRequestHeaders,
  copyResponse,
} from '../../utils/requestExport';
import type { RenameTarget } from '../collection/collectionPanelTypes';

interface RequestMenuItemsProps {
  req: { id: string; name: string };
  onClose: () => void;
  openRenameDialog: (target: RenameTarget) => void;
  handleDeleteRequest: (
    reqId: string,
    reqName: string,
    event: React.MouseEvent,
  ) => void;
}

export const RequestMenuItems: React.FC<RequestMenuItemsProps> = ({
  req,
  onClose,
  openRenameDialog,
  handleDeleteRequest,
}) => {
  const [showCopyOptions, setShowCopyOptions] = useState(false);
  const { collections, drafts, duplicateRequest } = useWorkspaceStore();
  const { toast } = useToast();

  const reqObj =
    drafts[req.id] ||
    collections
      .flatMap((collection) => collection.requests)
      .find((r) => r.id === req.id);
  const isHttp = reqObj && (reqObj.type === 'GET' || reqObj.type === 'POST');

  const handleCopy = async (type: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!reqObj) return;

    let text = '';
    let label = '';

    switch (type) {
      case 'link':
        text = copyLinkAddress(reqObj);
        label = 'Link address';
        break;
      case 'fetch':
        text = copyAsFetch(reqObj);
        label = 'Fetch command';
        break;
      case 'curl-bash':
        text = copyAsCurlBash(reqObj);
        label = 'cURL (bash) command';
        break;
      case 'curl-cmd':
        text = copyAsCurlCmd(reqObj);
        label = 'cURL (cmd) command';
        break;
      case 'curl-power':
        text = copyAsCurlPowerShell(reqObj);
        label = 'cURL (PowerShell) command';
        break;
      case 'headers':
        text = copyRequestHeaders(reqObj);
        label = 'Request headers';
        break;
      case 'response':
        text = copyResponse(reqObj);
        label = 'Response';
        if (!text) {
          toast({
            title: 'Copy Failed',
            description: 'No response data available to copy.',
            type: 'warning',
          });
          onClose();
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
    onClose();
  };

  if (showCopyOptions) {
    return (
      <>
        <DropdownMenuItem
          onClick={(event) => {
            event.stopPropagation();
            setShowCopyOptions(false);
          }}
          className="font-medium text-foreground/60"
        >
          <ChevronLeftIcon
            title="Back icon"
            className="mr-2 block h-3.5 w-3.5 shrink-0"
            strokeWidth={2.5}
          />
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
        {reqObj?.response && (
          <DropdownMenuItem onClick={(event) => handleCopy('response', event)}>
            Copy response
          </DropdownMenuItem>
        )}
      </>
    );
  }

  return (
    <>
      <DropdownMenuItem
        onClick={() => {
          openRenameDialog({
            type: 'request',
            id: req.id,
            name: req.name,
          });
          onClose();
        }}
      >
        Rename
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => {
          duplicateRequest(req.id);
          onClose();
        }}
      >
        Duplicate
      </DropdownMenuItem>
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
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={(event) => {
          handleDeleteRequest(req.id, req.name, event);
          onClose();
        }}
        className="text-primary-600 hover:text-primary-700 focus:text-primary-700"
      >
        Delete
      </DropdownMenuItem>
    </>
  );
};
