export const MAX_KEYWORDS = 5;

export interface KeywordValidationResult {
  isValid: boolean;
  error?: string;
  formattedKeywords: string[];
}

export const validateAndFormatKeywords = (
  newKeywords: string[],
  existingKeywords: string[]
): KeywordValidationResult => {
  // Format keywords
  const formattedKeywords = newKeywords
    .map(kw => kw.trim().toLowerCase())
    .filter(kw => kw !== "");

  // Check if total keywords would exceed limit
  if (existingKeywords.length + formattedKeywords.length > MAX_KEYWORDS) {
    return {
      isValid: false,
      error: `❌ Maximal ${MAX_KEYWORDS} Keywords erlaubt.`,
      formattedKeywords: []
    };
  }

  // Check for duplicates
  const uniqueNewKeywords = formattedKeywords.filter(
    kw => !existingKeywords.includes(kw)
  );

  if (uniqueNewKeywords.length === 0) {
    return {
      isValid: false,
      error: "❌ Alle Keywords existieren bereits.",
      formattedKeywords: []
    };
  }

  return {
    isValid: true,
    formattedKeywords: uniqueNewKeywords
  };
}; 