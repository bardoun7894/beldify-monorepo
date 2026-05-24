import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';

export function useLocalizedHref() {
  const { i18n } = useTranslation();
  const searchParams = useSearchParams();

  return (href: string) => {
    const [path, existingQuery] = href.split('?');
    const params = new URLSearchParams(existingQuery || '');

    // Always include locale in query parameters
    params.set('locale', i18n.language);

    return `${path}?${params.toString()}`;
  };
}
