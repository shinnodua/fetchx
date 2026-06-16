import type React from 'react';
import { useState } from 'react';
import { Button, Input } from '../../../../components';
import { useEnvironmentStore } from '../../../../store';
import {
  getSensitivePinMinLength,
  SENSITIVE_PIN_MIN_LENGTH,
  validateSensitivePin,
} from '../../utils/sensitiveCrypto';

interface PincodePanelProps {
  onLock: () => void;
}

export const PincodePanel: React.FC<PincodePanelProps> = ({ onLock }) => {
  const {
    sensitiveCryptoConfig,
    sensitiveCryptoError,
    sensitiveUnlocked,
    setSensitivePin,
    unlockSensitiveValues,
    lockSensitiveValues,
  } = useEnvironmentStore();

  const [pin, setPin] = useState('');
  const minPinLength = sensitiveCryptoConfig
    ? getSensitivePinMinLength(sensitiveCryptoConfig)
    : SENSITIVE_PIN_MIN_LENGTH;

  const handleSubmit = async () => {
    const success = sensitiveCryptoConfig
      ? await unlockSensitiveValues(pin)
      : await setSensitivePin(pin);

    if (success) {
      setPin('');
    }
  };

  const handleLock = () => {
    onLock();
    lockSensitiveValues();
  };

  return (
    <div className="mb-4 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Input
          label={
            sensitiveCryptoConfig
              ? 'Sensitive Pincode'
              : 'Set Sensitive Pincode'
          }
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder={`At least ${minPinLength} numbers`}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="h-10 rounded-lg"
          disabled={sensitiveUnlocked}
        />
        <div className="flex shrink-0 gap-2">
          {sensitiveUnlocked ? (
            <Button
              variant="outline"
              onClick={handleLock}
              className="h-10 cursor-pointer"
            >
              Lock Sensitive
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!validateSensitivePin(pin, minPinLength)}
              className="h-10 cursor-pointer"
            >
              {sensitiveCryptoConfig ? 'Unlock' : 'Set Pincode'}
            </Button>
          )}
        </div>
      </div>
      <p className="mt-2 text-xs text-foreground/50">
        Sensitive values are encrypted with this pincode before being saved. The
        pincode is not stored.
      </p>
      {sensitiveCryptoError && (
        <p className="mt-2 text-xs font-medium text-primary-600">
          {sensitiveCryptoError}
        </p>
      )}
    </div>
  );
};
