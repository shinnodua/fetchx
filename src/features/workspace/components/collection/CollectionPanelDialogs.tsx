import type React from 'react';
import { Button, Dialog, Input } from '../../../../components';
import type { RenameTarget } from './collectionPanelTypes';

interface CollectionPanelDialogsProps {
  renameTarget: RenameTarget | null;
  renameValue: string;
  colToDelete: { id: string; name: string } | null;
  reqToDelete: { id: string; name: string } | null;
  setRenameValue: (value: string) => void;
  closeRenameDialog: () => void;
  handleRenameSubmit: () => void;
  setColToDelete: (target: { id: string; name: string } | null) => void;
  setReqToDelete: (target: { id: string; name: string } | null) => void;
  deleteCollection: (id: string) => void;
  deleteRequest: (id: string) => void;
}

export const CollectionPanelDialogs: React.FC<CollectionPanelDialogsProps> = ({
  renameTarget,
  renameValue,
  colToDelete,
  reqToDelete,
  setRenameValue,
  closeRenameDialog,
  handleRenameSubmit,
  setColToDelete,
  setReqToDelete,
  deleteCollection,
  deleteRequest,
}) => (
  <>
    <Dialog
      isOpen={!!renameTarget}
      onClose={closeRenameDialog}
      title={`Rename ${
        renameTarget?.type === 'collection' ? 'Collection' : 'Request'
      }`}
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleRenameSubmit();
        }}
      >
        <Input
          label="Name"
          value={renameValue}
          onChange={(event) => setRenameValue(event.target.value)}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="ghost"
            type="button"
            onClick={closeRenameDialog}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button variant="primary" type="submit" className="cursor-pointer">
            Rename
          </Button>
        </div>
      </form>
    </Dialog>

    <Dialog
      isOpen={!!colToDelete}
      onClose={() => setColToDelete(null)}
      title="Delete Collection?"
      description={
        colToDelete ? (
          <span>
            Are you sure you want to delete the collection{' '}
            <strong className="text-foreground font-semibold">
              "{colToDelete.name}"
            </strong>
            ? This will permanently delete the collection and all its requests.
          </span>
        ) : (
          ''
        )
      }
    >
      <div className="flex justify-end gap-3 pt-2">
        <Button
          variant="ghost"
          onClick={() => setColToDelete(null)}
          className="cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            if (colToDelete) {
              deleteCollection(colToDelete.id);
              setColToDelete(null);
            }
          }}
          className="cursor-pointer"
        >
          Delete
        </Button>
      </div>
    </Dialog>

    <Dialog
      isOpen={!!reqToDelete}
      onClose={() => setReqToDelete(null)}
      title="Delete Request?"
      description={
        reqToDelete ? (
          <span>
            Are you sure you want to delete the request{' '}
            <strong className="text-foreground font-semibold">
              "{reqToDelete.name}"
            </strong>
            ? This action cannot be undone.
          </span>
        ) : (
          ''
        )
      }
    >
      <div className="flex justify-end gap-3 pt-2">
        <Button
          variant="ghost"
          onClick={() => setReqToDelete(null)}
          className="cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            if (reqToDelete) {
              deleteRequest(reqToDelete.id);
              setReqToDelete(null);
            }
          }}
          className="cursor-pointer"
        >
          Delete
        </Button>
      </div>
    </Dialog>
  </>
);
