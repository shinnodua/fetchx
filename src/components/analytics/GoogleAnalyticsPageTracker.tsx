import { useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';
import { trackGoogleAnalyticsPageView } from '../../services/analytics/googleAnalytics';

export function GoogleAnalyticsPageTracker() {
  const href = useLocation({
    select: (location) => location.href,
  });

  useEffect(() => {
    trackGoogleAnalyticsPageView(href);
  }, [href]);

  return null;
}
