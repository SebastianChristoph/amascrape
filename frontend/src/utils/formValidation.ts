export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateClusterName = (
  name: string,
  existingClusters: string[]
): ValidationResult => {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return {
      isValid: false,
      error: "Bitte gib einen Cluster-Titel ein."
    };
  }

  const titleLower = trimmedName.toLowerCase();
  if (existingClusters.includes(titleLower)) {
    return {
      isValid: false,
      error: "❌ Ein Market Cluster mit diesem Titel existiert bereits!"
    };
  }

  return { isValid: true };
};

export const validateKeywords = (keywords: string[]): ValidationResult => {
  if (keywords.length === 0) {
    return {
      isValid: false,
      error: "❌ Cluster braucht mindestens 1 Keyword"
    };
  }

  return { isValid: true };
}; 