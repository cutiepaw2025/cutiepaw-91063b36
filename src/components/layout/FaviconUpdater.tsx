import { useEffect } from "react";
import { useCompanySettings } from "@/hooks/use-company-settings";

export function FaviconUpdater() {
  const { data: companySettings } = useCompanySettings();

  useEffect(() => {
    if (companySettings?.favicon_url) {
      // Remove existing favicon links
      const existingLinks = document.querySelectorAll('link[rel*="icon"]');
      existingLinks.forEach(link => link.remove());

      // Add new favicon
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/x-icon';
      link.href = companySettings.favicon_url;
      document.head.appendChild(link);
    }
  }, [companySettings?.favicon_url]);

  return null; // This component doesn't render anything
}
