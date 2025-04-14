export interface LogEntry {
  type: string;
  content: string;
}

export const parseLogContent = (content: string): LogEntry[] => {
  const lines = content.split('\n');
  const entries: LogEntry[] = [];
  let currentEntry: string[] = [];

  lines.forEach(line => {
    if (line.startsWith('---')) {
      if (currentEntry.length > 0) {
        const typeMatch = currentEntry.find(l => l.includes('Typ:'))?.match(/Typ:\s*(\w+)/);
        if (typeMatch) {
          entries.push({
            type: typeMatch[1],
            content: currentEntry.join('\n')
          });
        }
        currentEntry = [];
      }
    } else if (line.trim()) {
      currentEntry.push(line);
    }
  });

  // Don't forget the last entry
  if (currentEntry.length > 0) {
    const typeMatch = currentEntry.find(l => l.includes('Typ:'))?.match(/Typ:\s*(\w+)/);
    if (typeMatch) {
      entries.push({
        type: typeMatch[1],
        content: currentEntry.join('\n')
      });
    }
  }

  return entries;
};

export const getUniqueTypes = (entries: LogEntry[]): string[] => {
  return Array.from(new Set(entries.map(entry => entry.type)));
};

export const getTypeCount = (entries: LogEntry[], type: string): number => {
  return entries.filter(entry => entry.type === type).length;
};

export const filterEntriesByType = (entries: LogEntry[], selectedType: string | null): LogEntry[] => {
  if (!selectedType) return entries;
  return entries.filter(entry => entry.type === selectedType);
};

export const isWarningLog = (filename: string | undefined): boolean => {
  return filename?.toLowerCase().startsWith('warning') ?? false;
}; 