import {
  Card,
  CardContent,
  Grid,
  Box,
  Typography,
  useTheme,
  Avatar,
  Stack,
} from "@mui/material";
import { Link } from "@mui/material";
import CustomButton from "./customButton";
import CustomChip from "./CustomChip";
import { LocationOn as LocationOnIcon, Visibility as VisibilityIcon } from "@mui/icons-material";
import SchoolIcon from "@mui/icons-material/School";
import { useNavigate } from "react-router-dom";

export default function CardSede({ sede }) {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Grid container justifyContent="center">
      <Box sx={{ maxWidth: "lg", width: "100%", px: 3 }}>
        <Grid container justifyContent="center">
          <Grid item xs={12} sm={10} md={8} lg={6}>
            <Card
              sx={{
                boxShadow: 4,
                borderRadius: 3,
                overflow: "hidden",
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  boxShadow: 8,
                  transform: "translateY(-4px)",
                },
              }}
            >
              <Avatar
                variant="square"
                sx={{
                  width: "100%",
                  height: 160,
                  backgroundColor: theme.palette.primary.main,
                  borderRadius: 0,
                }}
              >
                <SchoolIcon sx={{ fontSize: 60, color: "white" }} />
              </Avatar>

              <CardContent sx={{ p: 4 }}>
                {/* Header con título y botón */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 3,
                  }}
                >
                  <Typography
                    variant="h5"
                    component="h3"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      flex: 1,
                      mr: 2,
                    }}
                  >
                    {sede.nombre_sede}
                  </Typography>

                  <Link
                    href={sede.google_sede}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ textDecoration: "none" }}
                  >
                    <CustomButton
                      variant="contained"
                      startIcon={<LocationOnIcon />}
                      sx={{
                        minWidth: "auto",
                        px: 2,
                        py: 1,
                      }}
                    >
                      Ir
                    </CustomButton>
                  </Link>
                </Box>

                {/* Ubicación */}
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.secondary,
                    mb: 3,
                    lineHeight: 1.6,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <LocationOnIcon fontSize="small" color="primary" />
                  {sede.ubicacion_sede}
                </Typography>

                <CustomButton
                  variant="contained"
                  startIcon={<VisibilityIcon />}
                  sx={{
                    minWidth: "auto",
                    px: 2,
                    py: 1,
                  }}
                  onClick={() => navigate(`/infraestructura/sedes/${sede.id_sede}/aulas`)}
                >
                  Ver Sede
                </CustomButton>

                {/* PNFs */}
                <Box>
                  <Typography
                    variant="h6"
                    component="h4"
                    sx={{
                      fontWeight: 600,
                      mb: 2,
                      color: theme.palette.text.primary,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <SchoolIcon fontSize="small" />
                    PNFs Disponibles
                  </Typography>

                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {sede.pnfs.map((pnf, i) => (
                      <CustomChip
                        key={i}
                        label={pnf.nombre_pnf}
                        size="mediun"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Grid>
  );
}
