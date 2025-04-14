// components/StatCard.tsx

import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { iconMap, fallbackIcon } from "../../utils/iconUtils";

interface StatCardProps {
  iconKey: string;
  title: string;
  value: string | number;
  cardId?: string;
  isCurrency?: boolean;
}

const MetricCardSmall: React.FC<StatCardProps> = ({
  iconKey,
  title,
  value,
  cardId,
  isCurrency = false,
}) => {
  const theme = useTheme();
  const IconComponent = iconMap[iconKey] || fallbackIcon;
  const formattedValue = isCurrency
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(Number(value))
    : value;
  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        height: 80,
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
          height: 40,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
              <Box sx={{display: "flex", alignItems: "center", gap: 2}}>
                  {/* IconBox */}
                    <Box
                        sx={{
                        width: "50%", 
                        height: 45,
                        borderRadius: "12px",
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        }}
                    >
                        <IconComponent size={20} color={theme.palette.secondary.main} />
                    </Box>

                  
                    <Typography variant="body2" color="text.secondary">
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
        <Typography variant="h2" color="text.secondary">
          {formattedValue}
        </Typography>
      </Box>
    </Paper>
  );
};

export default MetricCardSmall;
