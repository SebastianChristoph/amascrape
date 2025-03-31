import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { clusterTypeConfig } from "../utils/clusterTypeConfig";

interface ClusterTypeDialogProps {
  open: boolean;
  onClose: () => void;
  type: "dynamic" | "static" | "snapshot" | null;
}

const ClusterTypeDialog: React.FC<ClusterTypeDialogProps> = ({
  open,
  onClose,
  type,
}) => {
  if (!type) return null;

  const config = clusterTypeConfig[type];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "background.paper",
          backgroundImage: "none",
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
        {config.title}
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>Key Features:</Typography>
        {config.features.map((feature, index) => (
          <Typography key={index} paragraph>
            • {feature}
          </Typography>
        ))}
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Best For:</Typography>
        {config.bestFor.map((useCase, index) => (
          <Typography key={index} paragraph>
            • {useCase}
          </Typography>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClusterTypeDialog; 