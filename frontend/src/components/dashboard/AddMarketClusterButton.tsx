import { Button } from "@mui/material";
import { MdAdd } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";

const AddMarketClusterButton: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<MdAdd size={24} />}
      onClick={() => navigate("/add-market-cluster")}
      sx={{
        padding: "12px 24px",
        height: "50px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        backgroundColor: theme.palette.accent.main,
        "&:hover": {
          backgroundColor: "primary.dark",
          transform: "scale(1.05)",
          transition: "all 0.2s ease-in-out",
          boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
        },
      }}
    >
      Add Market Cluster
    </Button>
  );
};

export default AddMarketClusterButton; 