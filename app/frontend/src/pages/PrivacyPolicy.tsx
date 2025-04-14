import { Box, Typography, Container } from "@mui/material";

const PrivacyPolicy = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Privacy Policy
        </Typography>
        <Typography variant="body1" paragraph>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>
        
        <Typography variant="h6" gutterBottom>
          1. Introduction
        </Typography>
        <Typography variant="body1" paragraph>
          Welcome to MarktZone. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
        </Typography>

        <Typography variant="h6" gutterBottom>
          2. Data We Collect
        </Typography>
        <Typography variant="body1" paragraph>
          We may collect, use, store and transfer different kinds of personal data about you, including:
        </Typography>
        <Typography variant="body1" component="ul" paragraph>
          <li>Identity Data (name, username)</li>
          <li>Contact Data (email address)</li>
          <li>Technical Data (IP address, browser type, device information)</li>
          <li>Usage Data (how you use our website)</li>
        </Typography>

        <Typography variant="h6" gutterBottom>
          3. How We Use Your Data
        </Typography>
        <Typography variant="body1" paragraph>
          We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
        </Typography>
        <Typography variant="body1" component="ul" paragraph>
          <li>To provide and maintain our service</li>
          <li>To notify you about changes to our service</li>
          <li>To provide customer support</li>
          <li>To gather analysis or valuable information so that we can improve our service</li>
          <li>To monitor the usage of our service</li>
          <li>To detect, prevent and address technical issues</li>
        </Typography>

        <Typography variant="h6" gutterBottom>
          4. Data Security
        </Typography>
        <Typography variant="body1" paragraph>
          We have implemented appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed.
        </Typography>

        <Typography variant="h6" gutterBottom>
          5. Your Legal Rights
        </Typography>
        <Typography variant="body1" paragraph>
          Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:
        </Typography>
        <Typography variant="body1" component="ul" paragraph>
          <li>Request access to your personal data</li>
          <li>Request correction of your personal data</li>
          <li>Request erasure of your personal data</li>
          <li>Object to processing of your personal data</li>
          <li>Request restriction of processing your personal data</li>
          <li>Request transfer of your personal data</li>
          <li>Right to withdraw consent</li>
        </Typography>

        <Typography variant="h6" gutterBottom>
          6. Contact Us
        </Typography>
        <Typography variant="body1" paragraph>
          If you have any questions about this privacy policy or our privacy practices, please contact us at:
        </Typography>
        <Typography variant="body1" paragraph>
          Email: privacy@marktzone.de<br />
          Address: Musterstraße 123, 12345 Musterstadt, Germany
        </Typography>
      </Box>
    </Container>
  );
};

export default PrivacyPolicy; 