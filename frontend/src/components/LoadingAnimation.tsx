import { Box, Typography } from "@mui/material";

const LoadingAnimation = () => {
  const tagRows = [
    {
      tags: ["Loading Data", "Analyzing Markets", "Processing Products", "Calculating Insights", "Preparing Charts"],
      duration: "15s",
      direction: "normal"
    },
    {
      tags: ["Market Analysis", "Product Research", "Competitor Tracking", "Sales Monitoring", "Trend Analysis"],
      duration: "19s",
      direction: "reverse"
    },
    {
      tags: ["Data Collection", "Performance Metrics", "Market Trends", "Customer Insights", "Sales Data"],
      duration: "10s",
      direction: "normal"
    },
    {
      tags: ["Price Tracking", "Inventory Analysis", "Market Share", "Growth Metrics", "Revenue Data"],
      duration: "16s",
      direction: "reverse"
    },
    {
      tags: ["Market Research", "Product Analytics", "Sales Tracking", "Performance Data", "Market Metrics"],
      duration: "13s",
      direction: "normal"
    }
  ];

  return (
    <Box
      sx={{
        width: "30rem",
        maxWidth: "90vw",
        display: "flex",
        flexDirection: "column",
        gap: "1rem 0",
        position: "relative",
        padding: "1.5rem 0",
        overflow: "hidden",
        mt: 2,
      }}
    >
      {tagRows.map((row, rowIndex) => (
        <Box
          key={rowIndex}
          className="loop-slider"
          sx={{
            "& .inner": {
              display: "flex",
              width: "fit-content",
              animation: `loop ${row.duration} linear infinite ${row.direction}`,
            },
          }}
        >
          <Box className="inner">
            {[...row.tags, ...row.tags].map((tag, index) => (
              <Box
                key={index}
                className="tag"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0 0.2rem",
                  color: "text.primary",
                  fontSize: "0.9rem",
                  backgroundColor: "background.paper",
                  borderRadius: "0.4rem",
                  padding: "0.7rem 1rem",
                  marginRight: "1rem",
                  boxShadow: "0 0.1rem 0.2rem rgba(0,0,0,0.2), 0 0.1rem 0.5rem rgba(0,0,0,0.3), 0 0.2rem 1.5rem rgba(0,0,0,0.4)",
                }}
              >
                <Typography component="span" sx={{ fontSize: "1.2rem", color: "text.secondary" }}>
                  #
                </Typography>
                {tag}
              </Box>
            ))}
          </Box>
        </Box>
      ))}
      <Box
        className="fade"
        sx={{
          pointerEvents: "none",
          background: "linear-gradient(90deg, background.default, transparent 30%, transparent 70%, background.default)",
          position: "absolute",
          inset: 0,
        }}
      />
      <style>
        {`
          @keyframes loop {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
        `}
      </style>
    </Box>
  );
};

export default LoadingAnimation; 