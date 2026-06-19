import { isDesktopApp } from '../platform';

const googleAnalyticsId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();

type GtagArguments =
  | ['config', string, Record<string, unknown>?]
  | ['event', string, Record<string, unknown>?]
  | ['js', Date];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: GtagArguments) => void;
  }
}

export const isGoogleAnalyticsEnabled = Boolean(
  googleAnalyticsId && import.meta.env.PROD && !isDesktopApp(),
);

function gtag(..._args: GtagArguments) {
  window.dataLayer = window.dataLayer ?? [];
  // biome-ignore lint/complexity/noArguments: gtag.js expects this command shape.
  window.dataLayer.push(arguments);
}

function createGoogleAnalyticsScript() {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
    googleAnalyticsId ?? '',
  )}`;

  return script;
}

export function initializeGoogleAnalytics() {
  if (
    !isGoogleAnalyticsEnabled ||
    document.querySelector('script[data-google-analytics]')
  ) {
    return;
  }

  const script = createGoogleAnalyticsScript();
  script.dataset.googleAnalytics = 'true';
  document.head.appendChild(script);

  window.gtag = gtag;
  window.gtag('js', new Date());
}

export function trackGoogleAnalyticsPageView(path: string) {
  if (!isGoogleAnalyticsEnabled || !window.gtag || !googleAnalyticsId) {
    return;
  }

  window.gtag('config', googleAnalyticsId, {
    page_path: path,
  });
}

export function trackGoogleAnalyticsEvent(
  name: string,
  parameters?: Record<string, unknown>,
) {
  if (!isGoogleAnalyticsEnabled || !window.gtag) {
    return;
  }

  window.gtag('event', name, parameters);
}

export type AnalyticsScreen =
  | 'workspace'
  | 'settings'
  | 'collections'
  | 'environments'
  | 'global';

export type AnalyticsAction =
  | 'send_request'
  | 'save_request'
  | 'new_request'
  | 'load_abi'
  | 'load_preset_abi'
  | 'import_request'
  | 'import_contract'
  | 'toggle_theme'
  | 'connect_wallet'
  | 'change_network'
  | 'network_switched'
  | 'view_account'
  | 'export_collections'
  | 'import_collections'
  | 'add_collection'
  | 'add_request'
  | 'delete_collection'
  | 'delete_request'
  | 'save_response'
  | 'delete_response'
  | 'add_environment'
  | 'delete_environment'
  | 'lock_environment'
  | 'unlock_environment'
  | 'add_variable'
  | 'remove_variable'
  | 'add_param'
  | 'add_header'
  | 'save_abi'
  | 'delete_abi'
  | 'delete_rpc';

export interface StandardAnalyticsEvent {
  screen: AnalyticsScreen;
  action: AnalyticsAction;
  [key: string]: unknown;
}

export function trackEvent(event: StandardAnalyticsEvent) {
  const eventName = `${event.screen}_${event.action}`;
  trackGoogleAnalyticsEvent(eventName, event);
}
