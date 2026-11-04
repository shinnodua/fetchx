import { ChevronLeftIcon } from '../../../../assets/svgs';
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../../../components';
import { useWorkspaceStore } from '../../../../store';

interface RequestMoveMenuItemsProps {
  requestId: string;
  onBack: () => void;
  onClose: () => void;
}

export const RequestMoveMenuItems = ({
  requestId,
  onBack,
  onClose,
}: RequestMoveMenuItemsProps) => {
  const { collections, moveRequest } = useWorkspaceStore();
  const destinations = collections.filter(
    (collection) =>
      !collection.requests.some((request) => request.id === requestId),
  );

  return (
    <>
      <DropdownMenuItem
        onClick={(event) => {
          event.stopPropagation();
          onBack();
        }}
        className="font-medium text-foreground/60"
      >
        <ChevronLeftIcon
          title="Back icon"
          className="mr-2 h-3.5 w-3.5 shrink-0"
        />
        Back
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <div className="max-h-64 overflow-y-auto">
        {destinations.map((collection) => (
          <DropdownMenuItem
            key={collection.id}
            onClick={(event) => {
              event.stopPropagation();
              moveRequest(requestId, collection.id);
              onClose();
            }}
          >
            <span className="truncate" title={collection.name}>
              {collection.name}
            </span>
          </DropdownMenuItem>
        ))}
        {destinations.length === 0 && (
          <p className="px-2.5 py-1.5 text-xs text-foreground/60">
            Create another collection to move this request.
          </p>
        )}
      </div>
    </>
  );
};
