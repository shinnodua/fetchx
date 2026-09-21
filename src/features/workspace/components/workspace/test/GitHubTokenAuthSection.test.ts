import { describe, expect, test } from 'bun:test';
import {
  GITHUB_CREDENTIAL_ACCESS_NOTICE,
  shouldShowGitHubCreateAppInstallationNotice,
  shouldShowGitHubCredentialAccessNotice,
} from '../GitHubTokenAuthSection';

describe('GitHubTokenAuthSection', () => {
  test('prepares users for credential-store access prompts before connecting', () => {
    const notice = `${GITHUB_CREDENTIAL_ACCESS_NOTICE.title} ${GITHUB_CREDENTIAL_ACCESS_NOTICE.description}`;

    expect(notice).toContain('system keychain');
    expect(notice).toContain('when the app reopens');
    expect(notice).toContain('Always Allow');
    expect(notice).toContain('reconnect and sync automatically');
  });

  test('hides the notice after the stored credential is available', () => {
    expect(shouldShowGitHubCredentialAccessNotice(false)).toBe(true);
    expect(shouldShowGitHubCredentialAccessNotice(true)).toBe(false);
  });

  test('shows the separate installation step only while creating repositories', () => {
    expect(shouldShowGitHubCreateAppInstallationNotice('create')).toBe(true);
    expect(shouldShowGitHubCreateAppInstallationNotice('connect')).toBe(false);
  });
});
