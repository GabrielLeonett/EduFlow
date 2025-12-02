import {
  Typography,
  Box,
  Grid,
  Container,
  Link,
  Stack,
  Paper,
  Divider,
  useTheme,
} from "@mui/material";
import {
  Facebook,
  Instagram,
  Twitter,
  LinkedIn,
  Room,
  Phone,
  Email,
} from "@mui/icons-material";
import CustomLabel from "./customLabel";
import CustomButton from "./customButton";

export default function Footer() {
  const theme = useTheme();

  const handleSubmit = (event) => {
    event.preventDefault();
    // Lógica del formulario aquí
  };

  return (
    <Paper
      component="footer"
      sx={{
        backgroundColor: theme.palette.primary.main,
        color: "white",
        py: 8,
        mt: 4,
        borderRadius: 0,
        boxShadow: theme.shadows[8],
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Información de contacto */}
          <Grid xs={12} sm={6} md={3}>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                pb: 1,
                borderBottom: "2px solid",
                borderColor: theme.palette.primary.light,
                fontWeight: theme.typography.fontWeightMedium,
              }}
            >
              Información de contacto
            </Typography>
            <Stack spacing={1}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Room
                  sx={{ color: theme.palette.secondary.main, fontSize: 20 }}
                />
                <Typography variant="body2">
                  Av. Universidad, Edificio Rectorado
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Phone
                  sx={{ color: theme.palette.secondary.main, fontSize: 20 }}
                />
                <Typography variant="body2">(0212) 555-1234</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Email
                  sx={{ color: theme.palette.secondary.main, fontSize: 20 }}
                />
                <Typography variant="body2">contacto@uptamca.edu.ve</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Link
                href="#"
                sx={{
                  color: "white",
                  "&:hover": { color: theme.palette.secondary.light },
                }}
              >
                <Facebook />
              </Link>
              <Link
                href="#"
                sx={{
                  color: "white",
                  "&:hover": { color: theme.palette.secondary.light },
                }}
              >
                <Instagram />
              </Link>
              <Link
                href="#"
                sx={{
                  color: "white",
                  "&:hover": { color: theme.palette.secondary.light },
                }}
              >
                <Twitter />
              </Link>
              <Link
                href="#"
                sx={{
                  color: "white",
                  "&:hover": { color: theme.palette.secondary.light },
                }}
              >
                <LinkedIn />
              </Link>
            </Stack>
          </Grid>

          {/* Servicios académicos */}
          <Grid xs={12} sm={6} md={3}>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                pb: 1,
                borderBottom: "2px solid",
                borderColor: theme.palette.primary.light,
                fontWeight: theme.typography.fontWeightMedium,
              }}
            >
              Servicios académicos
            </Typography>
            <Stack spacing={1}>
              {[
                "Carreras",
                "Biblioteca",
                "Laboratorios",
                "Calendario académico",
              ].map((item) => (
                <Link
                  key={item}
                  href="#"
                  sx={{
                    color: theme.palette.grey[300],
                    textDecoration: "none",
                    "&:hover": {
                      color: "white",
                      textDecoration: "underline",
                    },
                  }}
                >
                  <Typography variant="body2">{item}</Typography>
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Sección legal */}
          <Grid xs={12} sm={6} md={3}>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                pb: 1,
                borderBottom: "2px solid",
                borderColor: theme.palette.primary.light,
                fontWeight: theme.typography.fontWeightMedium,
              }}
            >
              Legal
            </Typography>
            <Stack spacing={1}>
              {[
                { text: "Política de privacidad", href: "/politica-privacidad" },
                {
                  text: "Términos y condiciones",
                  href: "/terminos-condiciones",
                },
                { text: "Accesibilidad", href: "/accesibilidad" },
              ].map((item) => (
                <Link
                  key={item.text}
                  href={item.href}
                  sx={{
                    color: theme.palette.grey[300],
                    textDecoration: "none",
                    "&:hover": {
                      color: "white",
                      textDecoration: "underline",
                    },
                  }}
                >
                  <Typography variant="body2">{item.text}</Typography>
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Formulario de contacto */}
          <Grid xs={12} sm={6} md={3}>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                pb: 1,
                borderBottom: "2px solid",
                borderColor: theme.palette.primary.light,
                fontWeight: theme.typography.fontWeightMedium,
              }}
            >
              Contáctanos
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <Stack spacing={2}>
                <CustomLabel variant="outlined" size="small" label="Nombre" />
                <CustomLabel
                  variant="outlined"
                  size="small"
                  label="Correo electrónico"
                  type="email"
                />
                <CustomLabel
                  variant="outlined"
                  size="small"
                  multiline
                  rows={4}
                  label="Mensaje"
                />
                <CustomButton type="submit" tipo="primary">
                  Primary
                </CustomButton>
              </Stack>
            </Box>
          </Grid>
        </Grid>

        {/* Línea inferior */}
        <Divider sx={{ my: 4, backgroundColor: theme.palette.grey[700] }} />
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: theme.palette.grey[400] }}>
            © {new Date().getFullYear()} Universidad Politécnica Territorial.
            Todos los derechos reservados.
          </Typography>
        </Box>
      </Container>
    </Paper>
  );
}
