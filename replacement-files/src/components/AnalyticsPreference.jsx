import { useEffect, useState } from 'react';
import { analyticsAvailable, consentAnalytics, storedConsent } from '../seo/analytics.js';
export default function AnalyticsPreference() {
  const [allowed, setAllowed] = useState(false);
  const [available, setAvailable] = useState(false);
  useEffect(() => { setAllowed(storedConsent()); setAvailable(analyticsAvailable()); }, []);
  if (!available) return null;
  return <div className="analytics-choice"><p>Optional analytics measure page views and contact actions. Form contents are excluded.</p><button type="button" className="text-link" aria-pressed={allowed} onClick={() => { consentAnalytics(!allowed); setAllowed(!allowed); }}>{allowed ? 'Turn analytics off' : 'Allow optional analytics'}</button></div>;
}
