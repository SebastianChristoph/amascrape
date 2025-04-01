import {
  Backdrop,
  Box,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";

interface AddAsinToMarketsDialogProps {
  open: boolean;
  newAsin: string;
  setNewAsin: (value: string) => void;
  asinError: string | null;
  setAsinError: (value: string | null) => void;
  addingAsin: boolean;
  isValidAsin: (asin: string) => boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AddAsinToMarketsDialog({
  open,
  newAsin,
  setNewAsin,
  asinError,
  setAsinError,
  addingAsin,
  isValidAsin,
  onConfirm,
  onCancel,
}: AddAsinToMarketsDialogProps) {
  return (
    <Backdrop open={open} sx={{ zIndex: 9999, color: "#fff" }}>
      <Paper
        elevation={4}
        sx={{
          p: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          width: 400,
          textAlign: "center",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Add Product to Market
        </Typography>

        <Typography variant="body2" color="text.secondary">
          You can manually add a product by entering its valid ASIN. Our system
          will scrape the product data and include it in the selected market.
        </Typography>

        <input
          type="text"
          value={newAsin}
          onChange={(e) => {
            const value = e.target.value;
            setNewAsin(value);
            if (!isValidAsin(value)) {
              setAsinError(
                "ASIN must start with 'B' and be exactly 10 characters."
              );
            } else {
              setAsinError(null);
            }
          }}
          placeholder="Enter ASIN (e.g. B07N4M94ZP)"
          style={{
            padding: "10px",
            width: "100%",
            borderRadius: "6px",
            border: asinError ? "2px solid red" : "1px solid #ccc",
            fontSize: "16px",
          }}
          disabled={addingAsin}
        />

        {asinError && (
          <Typography
            variant="caption"
            color="error"
            sx={{ mt: -1, mb: 1, textAlign: "left", width: "100%" }}
          >
            {asinError}
          </Typography>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          ⏱️ This usually takes under 1 minute to complete.
        </Typography>

        {addingAsin ? (
          <Backdrop open={addingAsin} sx={{ zIndex: 1301, color: "#fff" }}>
            <CircularProgress color="inherit" />
          </Backdrop>
        ) : (
          <Box sx={{ display: "flex", gap: 2 }}>
            <button
              disabled={!isValidAsin(newAsin) || addingAsin}
              onClick={onConfirm}
              style={{
                padding: "8px 20px",
                backgroundColor: !isValidAsin(newAsin) ? "#ccc" : "#1976d2",
                color: "white",
                borderRadius: "6px",
                fontWeight: "bold",
                border: "none",
                cursor: !isValidAsin(newAsin) ? "not-allowed" : "pointer",
              }}
            >
              Confirm
            </button>

            <button
              onClick={onCancel}
              disabled={addingAsin}
              style={{
                padding: "8px 20px",
                backgroundColor: addingAsin ? "#eee" : "#ccc",
                borderRadius: "6px",
                fontWeight: "bold",
                border: "none",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </Box>
        )}
      </Paper>
    </Backdrop>
  );
} 