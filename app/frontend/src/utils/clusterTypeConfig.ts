interface ClusterTypeConfig {
  title: string;
  features: string[];
  bestFor: string[];
}

export const clusterTypeConfig: Record<"dynamic" | "static" | "snapshot", ClusterTypeConfig> = {
  dynamic: {
    title: "Dynamic Cluster Details",
    features: [
      "Real-time market monitoring and automatic updates",
      "Continuous price tracking and competitor analysis",
      "Automated trend detection and alerts",
      "Historical data collection and pattern analysis"
    ],
    bestFor: [
      "Active market participants needing current data",
      "Products with frequent price changes",
      "Competitive market segments"
    ]
  },
  static: {
    title: "Static Cluster Details",
    features: [
      "Manual update control for data collection",
      "Stable market analysis without automatic changes",
      "Customizable update schedules",
      "Resource-efficient monitoring"
    ],
    bestFor: [
      "Stable markets with infrequent changes",
      "Budget-conscious monitoring needs",
      "Baseline market research"
    ]
  },
  snapshot: {
    title: "Snapshot Cluster Details",
    features: [
      "One-time comprehensive market capture",
      "Detailed point-in-time analysis",
      "Perfect for market benchmarking",
      "Export and report generation"
    ],
    bestFor: [
      "Market entry analysis",
      "Competitive benchmarking",
      "One-time research needs"
    ]
  }
}; 