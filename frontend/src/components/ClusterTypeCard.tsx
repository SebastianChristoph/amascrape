import { Box, Button, Paper, Typography, IconButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";

interface ClusterTypeCardProps {
  type: "dynamic" | "static" | "snapshot";
  icon: React.ReactNode;
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
  onDetailsClick: (e: React.MouseEvent) => void;
}

const ClusterTypeCard: React.FC<ClusterTypeCardProps> = ({
  type,
  icon,
  title,
  description,
  isSelected,
  onClick,
  onDetailsClick,
}) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={isSelected ? 4 : 1}
      onClick={onClick}
      sx={{
        p: 3,
        cursor: "pointer",
        backgroundColor: isSelected ? "primary.dark" : "background.paper",
        border: "1px solid",
        borderColor: isSelected ? "secondary.main" : "rgba(255, 255, 255, 0.1)",
        borderRadius: 2,
        transition: "all 0.2s ease-in-out",
        transform: isSelected ? "scale(1.02)" : "scale(1)",
        "&:hover": {
          transform: "scale(1.02)",
          borderColor: "secondary.main",
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" align="center" color={isSelected ? "white" : "text.primary"}>
          {title}
        </Typography>
        <Typography 
          variant="body2" 
          align="center"
          color={isSelected ? "white" : "text.secondary"}
        >
          {description}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={onDetailsClick}
          sx={{
            mt: 1,
            color: isSelected ? "white" : "primary",
            borderColor: isSelected ? "white" : "primary.main",
            '&:hover': {
              borderColor: isSelected ? "white" : "primary.main",
              backgroundColor: isSelected ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.04)",
            },
          }}
        >
          View Details
        </Button>
      </Box>
    </Paper>
  );
};

export default ClusterTypeCard; 