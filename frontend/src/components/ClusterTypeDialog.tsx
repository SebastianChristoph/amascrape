import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AnimatePresence, motion } from "framer-motion";
import { FaBullseye, FaCamera, FaCheckCircle, FaCube, FaUserCog } from "react-icons/fa";
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
  const theme = useTheme();

  if (!type) return null;

  const config = clusterTypeConfig[type];

  const getIcon = () => {
    switch (type) {
      case "dynamic":
        return <FaBullseye size={32} color={theme.palette.secondary.main} />;
      case "static":
        return <FaCube size={32} color={theme.palette.secondary.main} />;
      case "snapshot":
        return <FaCamera size={32} color={theme.palette.secondary.main} />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          open={open}
          onClose={onClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            component: motion.div,
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: 20 },
            transition: { duration: 0.3 },
            sx: {
              backgroundColor: "background.paper",
              backgroundImage: "none",
              borderRadius: 2,
              overflow: "hidden",
            }
          }}
        >
          <DialogTitle 
            sx={{ 
              borderBottom: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 3,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "16px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {getIcon()}
            </Box>
            <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
              {config.title}
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 1,
                  color: "primary.main",
                  mb: 2
                }}
              >
                <FaCheckCircle size={20} />
                Key Features
              </Typography>
              <Box component={motion.div} layout>
                {config.features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Typography 
                      paragraph 
                      sx={{ 
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        py: 0.5
                      }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          backgroundColor: "secondary.main",
                        }}
                      />
                      {feature}
                    </Typography>
                  </motion.div>
                ))}
              </Box>
            </Box>

            <Box>
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 1,
                  color: "primary.main",
                  mb: 2
                }}
              >
                <FaUserCog size={20} />
                Best For
              </Typography>
              <Box component={motion.div} layout>
                {config.bestFor.map((useCase, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                  >
                    <Typography 
                      paragraph
                      sx={{ 
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        py: 0.5
                      }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          backgroundColor: "secondary.main",
                        }}
                      />
                      {useCase}
                    </Typography>
                  </motion.div>
                ))}
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button 
              onClick={onClose} 
              variant="contained"
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1,
                textTransform: "none",
                fontSize: "1rem",
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default ClusterTypeDialog; 