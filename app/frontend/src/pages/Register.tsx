import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link as RouterLink } from "react-router-dom";
import { Link } from "@mui/material";

import { useSnackbar } from "../providers/SnackbarProvider";
import { FaUserPlus } from "react-icons/fa"; // 🔥 Register Icon
import { AiFillAmazonCircle, AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai"; // 🔥 Password Icons
import { motion } from "framer-motion"; // 🚀 Für Animation
import VerifyService from "../services/VerifyService";
import UserService from "../services/UserService";

export default function Register() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRepeat, setShowPasswordRepeat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mockedLink, setMockedLink] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const response = await UserService.register(username, email, password, passwordRepeat);
    setLoading(false);

    if (response.success) {
      showSnackbar("✅ Verification email sent! Click the link to activate.");
      setMockedLink(response.mocked_verification_link || "");
    } else {
      showSnackbar(response.message, "error");
    }
  };

  // ✅ Handle Mock Verification Click
  const handleVerification = async () => {
    if (!mockedLink) return;
    const token = mockedLink.split("/").pop();
    if (!token) return;

    const verifyResponse = await VerifyService.verifyUser(token);
    if (verifyResponse.success) {
      showSnackbar(`✅ User ${verifyResponse.username} (${verifyResponse.email}) created.`);
      navigate("/login", { state: { username: verifyResponse.username } });
    } else {
      showSnackbar(verifyResponse.message, "error");
    }
  };

  return (
    <Container
      maxWidth="lg"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: "900px",
          height: "600px",
          display: "flex",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        {/* ✅ Left Side: Blue Box */}
        <Box
          sx={{
            width: "50%",
            backgroundColor: "#0096FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
                   <Box sx={{mt: 0.5}}>
                       <AiFillAmazonCircle size={40} color="white" />
                       </Box>
                   <Typography
                     variant="h2"
                     sx={{
                       color: "white",
                       fontWeight: "bold",
                       letterSpacing: 1,
                     }}
                   >
                     
                     AmaScraper
                   </Typography>
                 </Box>
         

        {/* ✅ Right Side: Registration Form */}
        <Box
          sx={{
            width: "50%",
            p: 4,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            backgroundColor: "#fff",
          }}
        >
          <Typography
            variant="h5"
            sx={{ mb: 2, textAlign: "center", fontWeight: "bold", color: "primary.main" }}
          >
            Create an Account 🚀
          </Typography>
          <Typography variant="body2" sx={{ textAlign: "center", mb: 3, color: "text.secondary" }}>
            Sign up to access powerful data scraping tools.
          </Typography>

          <form onSubmit={handleRegister}>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Email"
              variant="outlined"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 2 }}
            />

            {/* ✅ Password Field with Visibility Toggle */}
            <TextField
              fullWidth
              label="Password"
              variant="outlined"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* ✅ Repeat Password Field */}
            <TextField
              fullWidth
              label="Repeat Password"
              variant="outlined"
              type={showPasswordRepeat ? "text" : "password"}
              value={passwordRepeat}
              onChange={(e) => setPasswordRepeat(e.target.value)}
              required
              sx={{ mb: 3 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPasswordRepeat(!showPasswordRepeat)}>
                      {showPasswordRepeat ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              startIcon={<FaUserPlus />}
              sx={{
                height: 50,
                fontSize: 16,
                fontWeight: "bold",
                textTransform: "none",
              }}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </Button>
          </form>

            {/* ✅ Back to Login Link */}
            <Typography sx={{ mt: 2, textAlign: "center" }}>
            Already have an account?{" "}
            <Link to="/login" component={RouterLink} sx={{ color: "primary.main", fontWeight: "bold" }}>
  Back to Login
</Link>

          </Typography>

          {/* ✅ Mocked Verification Link */}
          {mockedLink && (
            <Typography
              sx={{ mt: 2, color: "blue", cursor: "pointer", textAlign: "center" }}
              onClick={handleVerification}
            >
              Click here to activate your account
            </Typography>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
