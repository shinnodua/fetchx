import type React from 'react';
import { useState } from 'react';
import { CopyIcon } from '../../../../../assets/svgs';
import { Button, Dialog, Input, useToast } from '../../../../../components';
import { trackEvent } from '../../../../../services/analytics/googleAnalytics';
import { openExternalUrl } from '../../../../../services/platform';
import {
  createDefaultResponseName,
  getPayloadText,
  getTypeLabel,
} from '../../../utils/responsePayload';
import { PayloadTabs } from './ResponsePayloadTabs';

export {
  getPayloadKeyLineInset,
  payloadInspectorRowClassName,
  payloadPreviewCardClassName,
  rawPayloadCodeClassName,
} from './ResponsePayloadTabs';

interface ResponsePayloadViewerProps {
  data: unknown;
  onSave?: (name: string) => boolean;
  explorerUrl?: string;
}

export const ResponsePayloadDialog: React.FC<{
  data: unknown;
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
}> = ({ data, isOpen, onClose, title = 'Payload Output' }) => {
  const { toast } = useToast();
  const handleCopyPayload = async () => {
    try {
      await navigator.clipboard.writeText(getPayloadText(data));
      toast({
        title: 'Copied to Clipboard',
        description: 'Response payload copied successfully.',
        type: 'success',
      });
    } catch {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy response payload to clipboard.',
        type: 'error',
      });
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={getTypeLabel(data)}
      className="flex h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-none flex-col overflow-hidden"
    >
      <PayloadTabs
        data={data}
        actions={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyPayload}
            className="h-7 gap-1.5 rounded-lg px-2 text-[10px] font-semibold uppercase tracking-wider text-primary-600 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200"
          >
            <CopyIcon
              title="Copy response payload"
              className="h-3.5 w-3.5 shrink-0"
              strokeWidth={1.5}
            />
            Copy
          </Button>
        }
      />
    </Dialog>
  );
};

export const ResponsePayloadViewer: React.FC<ResponsePayloadViewerProps> = ({
  data,
  explorerUrl,
  onSave,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [responseName, setResponseName] = useState(createDefaultResponseName);
  const openSaveDialog = () => {
    setResponseName(createDefaultResponseName());
    setIsSaveDialogOpen(true);
  };
  const handleSaveResponse = () => {
    trackEvent({ screen: 'workspace', action: 'save_response' });
    if (onSave?.(responseName)) setIsSaveDialogOpen(false);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-1.5">
        <span className="text-[10px] font-semibold text-foreground/50 uppercase tracking-wider">
          Payload Output
        </span>
        <span className="rounded-full border border-foreground/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-foreground/40">
          {getTypeLabel(data)}
        </span>
      </div>
      <PayloadTabs
        data={data}
        actions={
          <>
            {explorerUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => openExternalUrl(explorerUrl)}
                className="h-7 rounded-lg px-2 text-[10px] font-semibold uppercase tracking-wider text-primary-600 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200"
              >
                Explorer
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              className="h-7 rounded-lg px-2 text-[10px] font-semibold uppercase tracking-wider text-primary-600 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200"
            >
              Expand
            </Button>
            {onSave && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={openSaveDialog}
                className="h-7 rounded-lg px-2 text-[10px] font-semibold uppercase tracking-wider text-primary-600 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200"
              >
                Save
              </Button>
            )}
          </>
        }
      />
      <ResponsePayloadDialog
        data={data}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
      {onSave && (
        <Dialog
          isOpen={isSaveDialogOpen}
          onClose={() => setIsSaveDialogOpen(false)}
          title="Save Response"
          description="Name this response before saving it under the request."
        >
          <div className="space-y-4">
            <Input
              value={responseName}
              onChange={(event) => setResponseName(event.target.value)}
              placeholder="Response name"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsSaveDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveResponse}
                disabled={!responseName.trim()}
              >
                Save Response
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
