export const fileIcon = (content_type: string) => {
  if (content_type.startsWith('/image')) return '🖼️';
  if (content_type.includes('pdf')) return '📄';
  if (content_type.includes('document') || content_type.includes('word'))
    return '📝';
  if (content_type.includes('excel') || content_type.includes('spreadsheet'))
    return '📊';
};

export const getFileName = (url: string, originalName: string) => {
  return originalName || url.split('/').pop() || 'unknown file';
};
