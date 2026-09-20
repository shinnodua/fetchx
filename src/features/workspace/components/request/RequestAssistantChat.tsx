import { ChatIcon } from '../../../../assets/svgs';
import { Button } from '../../../../components';
import { cn } from '../../../../utils/cn';
import { useRequestAssistantController } from '../../hooks';
import type { RequestItem } from '../../types';
import {
  isRequestAssistantWorkingMessage,
  RequestAssistantPanel,
  requestAssistantManageButtonClassName,
  requestAssistantMessageClassName,
  requestAssistantPanelClassName,
  requestAssistantPanelMotion,
} from './RequestAssistantPanel';

interface RequestAssistantChatProps {
  activeRequest: RequestItem | null;
  launcherClassName?: string;
  launcherLabel?: string;
}

export const shouldScrollRequestAssistantChatToEnd = (
  isOpen: boolean,
  messageCount: number,
) => isOpen && messageCount > 0;

export function RequestAssistantChat({
  activeRequest,
  launcherClassName,
  launcherLabel,
}: RequestAssistantChatProps) {
  const controller = useRequestAssistantController(activeRequest);

  return (
    <>
      <Button
        type="button"
        variant={launcherLabel ? 'primary' : 'ghost'}
        size="sm"
        onClick={controller.handleOpenAssistant}
        className={cn(
          launcherLabel
            ? 'h-11 w-auto cursor-pointer gap-2 rounded-xl px-5 text-sm font-semibold'
            : 'h-8 w-8 cursor-pointer rounded-lg p-0 text-foreground/60 hover:bg-background hover:text-foreground',
          launcherClassName,
        )}
        title="Open request assistant"
      >
        <ChatIcon
          title="Open request assistant"
          className="h-[18px] w-[18px]"
        />
        {launcherLabel && <span>{launcherLabel}</span>}
      </Button>
      <RequestAssistantPanel controller={controller} />
    </>
  );
}

export {
  isRequestAssistantWorkingMessage,
  requestAssistantManageButtonClassName,
  requestAssistantMessageClassName,
  requestAssistantPanelClassName,
  requestAssistantPanelMotion,
};
