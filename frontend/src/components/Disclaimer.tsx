import { Box, Divider, Typography } from "@mui/material";
import { MdWarningAmber } from "react-icons/md";

const Disclaimer: React.FC = () => {
  return (
    <Box sx={{ mt: 4, p: 2, textAlign: "center" }}>
      <Divider sx={{ mb: 2 }} />
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 1,
          mb: 1,
        }}
      >
        <MdWarningAmber size={20} color="#f57c00" />
        <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
          Important Notice
        </Typography>
      </Box>
      <Typography variant="body2" color="text.primary">
        <strong>* Disclaimer:</strong> This tool exclusively supports and
        analyzes products from the U.S. Amazon marketplace (
        <em>amazon.com</em>). Data, rankings, and insights are limited to the
        U.S. region and may not reflect availability or performance in other
        countries.
      </Typography>
    </Box>
  );
};

export default Disclaimer; 