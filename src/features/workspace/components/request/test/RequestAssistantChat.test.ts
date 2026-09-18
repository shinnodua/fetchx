import { describe, expect, test } from 'bun:test';

import {
  isRequestAssistantWorkingMessage,
  requestAssistantManageButtonClassName,
  requestAssistantMessageClassName,
  requestAssistantPanelClassName,
  requestAssistantPanelMotion,
  shouldScrollRequestAssistantChatToEnd,
} from '../RequestAssistantChat';

describe('RequestAssistantChat', () => {
  test('keeps whole words together while wrapping long unbroken content', () => {
    expect(requestAssistantMessageClassName).toContain('max-w-[88%]');
    expect(requestAssistantMessageClassName).toContain('break-words');
    expect(requestAssistantMessageClassName).not.toContain('break-all');
  });

  test('uses a tinted surface to separate the assistant from the workspace', () => {
    expect(requestAssistantPanelClassName).toContain('bg-primary-50/80');
    expect(requestAssistantPanelClassName).toContain('border-primary-200/80');
    expect(requestAssistantPanelClassName).toContain('backdrop-blur-xl');
  });

  test('matches the Manage control height to the compact agent select trigger', () => {
    expect(requestAssistantManageButtonClassName).toContain('h-8');
    expect(requestAssistantManageButtonClassName).not.toContain('h-10');
  });

  test('animates the panel from and toward its launcher', () => {
    expect(requestAssistantPanelMotion.initial).toEqual({
      opacity: 0,
      scale: 0.96,
      y: 12,
    });
    expect(requestAssistantPanelMotion.animate).toEqual({
      opacity: 1,
      scale: 1,
      y: 0,
    });
    expect(requestAssistantPanelMotion.exit).toEqual({
      opacity: 0,
      scale: 0.96,
      y: 12,
    });
  });

  test('identifies the in-progress message for its processing animation', () => {
    expect(
      isRequestAssistantWorkingMessage({
        id: 'working',
        role: 'system',
        content: 'Working on your request. This can take a moment.',
      }),
    ).toBe(true);
    expect(
      isRequestAssistantWorkingMessage({
        id: 'complete',
        role: 'assistant',
        content: 'Working on your request. This can take a moment.',
      }),
    ).toBe(false);
  });

  test('scrolls to the newest message whenever the assistant reopens', () => {
    expect(shouldScrollRequestAssistantChatToEnd(true, 3)).toBe(true);
    expect(shouldScrollRequestAssistantChatToEnd(false, 3)).toBe(false);
    expect(shouldScrollRequestAssistantChatToEnd(true, 0)).toBe(false);
  });
});
