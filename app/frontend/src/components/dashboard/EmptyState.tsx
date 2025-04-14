import { Typography } from "@mui/material";

interface EmptyStateProps {
  message?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  message = "No market clusters found." 
}) => {
  return (
    <Typography sx={{ textAlign: "center", mt: 4 }} variant="body1">
      {message}
    </Typography>
  );
};

export default EmptyState; 