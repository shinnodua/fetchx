export function formatPublishedDate(
  publishedAt?: string,
  locale?: string,
): string | undefined {
  if (!publishedAt || !publishedAt.trim()) return undefined;

  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) {
    return publishedAt;
  }

  return date.toLocaleString(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatUpdateDescription(
  publishedAt?: string,
  locale?: string,
): string | undefined {
  const formattedDate = formatPublishedDate(publishedAt, locale);
  return formattedDate ? `Published ${formattedDate}` : undefined;
}
