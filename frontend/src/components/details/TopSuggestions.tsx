import { Box, Chip, Typography } from "@mui/material";
import { FaSearch } from "react-icons/fa";

interface TopSuggestionsProps {
  suggestions: string;
}

export default function TopSuggestions({ suggestions }: TopSuggestionsProps) {
  return (
    <Box sx={{ mt: 4 }}>
      <Typography
        variant="h6"
        color="text.secondary"
        sx={{
          mb: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <FaSearch size={16} />
        Top Suggestions
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {suggestions
          .split(",")
          .map((suggestion: string, idx: number) => (
            <Chip
              key={idx}
              label={suggestion.trim()}
              variant="outlined"
              color="primary"
              size="small"
              sx={{
                borderRadius: "16px",
                height: "32px",
                fontSize: "0.875rem",
                fontWeight: 400,
                borderColor: "secondary.main",
                color: "text.secondary",
                "&:hover": {
                  backgroundColor: "primary.dark",
                  transform: "translateY(-4px)",
                },
                "& .MuiChip-label": {
                  padding: "0 12px",
                },
                transition: "transform 0.2s",
              }}
            />
          ))}
      </Box>
    </Box>
  );
} 