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
  googleAnalyticsId && import.meta.env.PROD,
);

function gtag(...args: GtagArguments) {
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(args);
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
