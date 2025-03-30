import { Box, useTheme } from "@mui/material";

const PrimaryLineDivider = () => {
    const theme = useTheme();
    return (
      <Box
        sx={{
          width: 170,
          backgroundColor: theme.palette.primary.main,
          height: 8,
        }}
      />
    );
  };
  

export default PrimaryLineDivider;
