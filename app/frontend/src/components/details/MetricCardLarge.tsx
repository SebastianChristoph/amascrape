// components/StatCard.tsx

import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { iconMap, fallbackIcon } from "../../utils/iconUtils";
import Grid from "@mui/material/Grid2";
import CustomSparkLine from "../charts/CustomSparkLine";

interface StatCardProps {
  iconKey: string;
  title: string;
  value: string | number;
  cardId?: string;
  isCurrency?: boolean;
  hasSparkline?: boolean;
}

const MetricCardLarge: React.FC<StatCardProps> = ({
  iconKey,
  title,
  value,
  cardId,
  isCurrency = false,
  hasSparkline = false,
}) => {
  const theme = useTheme();
  const IconComponent = iconMap[iconKey] || fallbackIcon;
  const formattedValue = isCurrency
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      }).format(Number(value))
    : value;
  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        height: "100%",
        backgroundColor: "background.paper",
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        transition: "transform 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
        },
        "&:hover .card-id": {
          opacity: 1,
        },
        border: "1px solid rgba(255, 255, 255, 0.25)",
        flex: 1,
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: 45,
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 1,
        }}
      >
        <Box
          sx={{
            width: 45,
            height: 45,
            borderRadius: "12px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconComponent size={22} color={theme.palette.secondary.main} />
        </Box>

        <Typography variant="h6" color="text.secondary">
          {title}
        </Typography>

        {cardId && (
          <Typography
            className="card-id"
            sx={{
              fontSize: 10,
              color: "gray",
              textAlign: "end",
              opacity: 0,
              transition: "opacity 0.3s ease-in-out",
            }}
          >
            Card-Id: {cardId}
          </Typography>
        )}
      </Box>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Typography variant="body2" color="text.primary">
            Total Revenue
          </Typography>
          <Typography
            variant="h1"
            color="text.secondary"
            sx={{ fontWeight: 600, fontSize: "2rem" }}
          >
            {formattedValue}
          </Typography>
        </Grid>

        {hasSparkline && (
          <Grid size={{ xs: 12, md: 5 }}>
            <Box>
              <CustomSparkLine />
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default MetricCardLarge;
