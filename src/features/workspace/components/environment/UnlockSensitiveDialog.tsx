import type React from 'react';
import { useState } from 'react';
import { Button, Dialog, Input } from '../../../../components';
import { useEnvironmentStore } from '../../../../store';
import {
  getSensitivePinMinLength,
  SENSITIVE_PIN_MIN_LENGTH,
  validateSensitivePin,
} from '../../utils/sensitiveCrypto';

interface UnlockSensitiveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: () => void;
}

export const UnlockSensitiveDialog: React.FC<UnlockSensitiveDialogProps> = ({
  isOpen,
  onClose,
  onUnlockSuccess,
}) => {
  const { sensitiveCryptoConfig, unlockSensitiveValues } =
    useEnvironmentStore();
  const [unlockPin, setUnlockPin] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const minPinLength = sensitiveCryptoConfig
    ? getSensitivePinMinLength(sensitiveCryptoConfig)
    : SENSITIVE_PIN_MIN_LENGTH;

  const handleClose = () => {
    setUnlockPin('');
    setUnlockError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError(null);
    const success = await unlockSensitiveValues(unlockPin);
    if (success) {
      handleClose();
      onUnlockSuccess();
    } else {
      setUnlockError('Incorrect pincode. Please try again.');
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Unlock Sensitive Variables"
      description="This request uses sensitive variables that are currently locked. Enter your pincode to unlock and send the request."
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Input
          label="Sensitive Pincode"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder={`Enter your ${minPinLength}+ digit pincode`}
          value={unlockPin}
          onChange={(e) => {
            setUnlockPin(e.target.value);
            setUnlockError(null);
          }}
          className="h-10 rounded-lg"
          autoFocus
        />
        {unlockError && (
          <p className="text-xs font-medium text-primary-600">{unlockError}</p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            type="button"
            onClick={handleClose}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={!validateSensitivePin(unlockPin, minPinLength)}
            className="cursor-pointer"
          >
            Unlock & Send
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
