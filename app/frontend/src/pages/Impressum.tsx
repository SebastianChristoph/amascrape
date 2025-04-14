import { Box, Typography, Container } from "@mui/material";

const TermsAndConditions = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Terms and Conditions
        </Typography>
        <Typography variant="body1" paragraph>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>

        <Typography variant="h6" gutterBottom>
          1. Introduction
        </Typography>
        <Typography variant="body1" paragraph>
          Welcome to MarktZone. These Terms and Conditions ("Terms") govern your use of our platform, analytics, information, applications, websites, and other products and services (collectively, the "Services"). By accessing or using our Services, you agree to be bound by these Terms.
        </Typography>

        <Typography variant="h6" gutterBottom>
          2. Company Information
        </Typography>
        <Typography variant="body1" paragraph>
          MarktZone GmbH<br />
          Musterstraße 123<br />
          12345 Musterstadt<br />
          Germany
        </Typography>
        <Typography variant="body1" paragraph>
          Contact:<br />
          Email: info@marktzone.de<br />
          Phone: +49 123 456789
        </Typography>
        <Typography variant="body1" paragraph>
          Managing Director: Max Mustermann<br />
          Commercial Register: Local Court Musterstadt, HRB 12345<br />
          VAT ID: DE123456789
        </Typography>

        <Typography variant="h6" gutterBottom>
          3. Access and Account
        </Typography>
        <Typography variant="body1" paragraph>
          You must be at least 18 years old to use our Services. When creating an account, you must provide accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
        </Typography>

        <Typography variant="h6" gutterBottom>
          4. Subscription and Payments
        </Typography>
        <Typography variant="body1" paragraph>
          Some features of our Services require a subscription. By subscribing, you agree to:
        </Typography>
        <Typography variant="body1" component="ul" paragraph>
          <li>Pay all applicable fees for the Services you select</li>
          <li>Maintain accurate billing information</li>
          <li>Authorize us to charge your payment method for subscription fees</li>
          <li>Understand that subscriptions automatically renew unless cancelled</li>
        </Typography>

        <Typography variant="h6" gutterBottom>
          5. Intellectual Property
        </Typography>
        <Typography variant="body1" paragraph>
          All content, features, and functionality of our Services are owned by MarktZone and are protected by international copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works of any part of our Services without our express written permission.
        </Typography>

        <Typography variant="h6" gutterBottom>
          6. User Obligations
        </Typography>
        <Typography variant="body1" paragraph>
          You agree to:
        </Typography>
        <Typography variant="body1" component="ul" paragraph>
          <li>Use our Services only for lawful purposes</li>
          <li>Not interfere with or disrupt the Services</li>
          <li>Not attempt to gain unauthorized access to any part of the Services</li>
          <li>Not use the Services to transmit any harmful or malicious code</li>
          <li>Comply with all applicable laws and regulations</li>
        </Typography>

        <Typography variant="h6" gutterBottom>
          7. Limitation of Liability
        </Typography>
        <Typography variant="body1" paragraph>
          To the maximum extent permitted by law, MarktZone shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
        </Typography>

        <Typography variant="h6" gutterBottom>
          8. Changes to Terms
        </Typography>
        <Typography variant="body1" paragraph>
          We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Services after any changes constitutes your acceptance of the new Terms.
        </Typography>

        <Typography variant="h6" gutterBottom>
          9. Governing Law
        </Typography>
        <Typography variant="body1" paragraph>
          These Terms shall be governed by and construed in accordance with the laws of Germany, without regard to its conflict of law provisions.
        </Typography>

        <Typography variant="h6" gutterBottom>
          10. Contact Us
        </Typography>
        <Typography variant="body1" paragraph>
          If you have any questions about these Terms, please contact us at:
        </Typography>
        <Typography variant="body1" paragraph>
          Email: legal@marktzone.de<br />
          Address: Musterstraße 123, 12345 Musterstadt, Germany
        </Typography>
      </Box>
    </Container>
  );
};

export default TermsAndConditions; 