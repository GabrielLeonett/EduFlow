import {
  Card,
  CardContent,
  Grid,
  Box,
  Typography,
  useTheme,
  Avatar,
  Stack,
  Chip,
  Tooltip,
} from "@mui/material";
import { Link } from "@mui/material";
import CustomButton from "./customButton";
import { 
  LocationOn as LocationOnIcon, 
  Visibility as VisibilityIcon,
  School as SchoolIcon 
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export default function CardSede({ sede }) {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Grid item xs={12} sm={6} md={4} lg={3}>
      <Card
        sx={{
          height: '420px', // Altura fija para consistencia
          boxShadow: 2,
          borderRadius: 3,
          overflow: "hidden",
          transition: "all 0.3s ease-in-out",
          border: `1px solid ${theme.palette.divider}`,
          "&:hover": {
            boxShadow: 6,
            transform: "translateY(-4px)",
            borderColor: theme.palette.primary.light,
          },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header con ícono y título */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            p: 2.5,
            gap: 2,
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            minHeight: 100, // Altura fija para el header
          }}
        >
          <Avatar
            sx={{
              backgroundColor: 'white',
              color: theme.palette.primary.main,
              width: 48,
              height: 48,
              flexShrink: 0,
              mt: 0.5,
            }}
          >
            <SchoolIcon />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}> {/* minWidth: 0 para evitar overflow */}
            <Tooltip title={sede.nombre_sede} arrow>
              <Typography
                variant="h6"
                component="h3"
                sx={{
                  fontWeight: 600,
                  color: 'white',
                  lineHeight: 1.3,
                  mb: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minHeight: '2.6em', // 2 líneas de altura
                }}
              >
                {sede.nombre_sede}
              </Typography>
            </Tooltip>
            <Tooltip title={sede.ubicacion_sede} arrow>
              <Typography
                variant="body2"
                sx={{
                  color: 'white',
                  opacity: 0.9,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minHeight: '2.4em', // 2 líneas de altura
                }}
              >
                <LocationOnIcon fontSize="small" />
                {sede.ubicacion_sede}
              </Typography>
            </Tooltip>
          </Box>
        </Box>

        <CardContent sx={{ 
          p: 2.5, 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          gap: 2,
        }}>
          {/* PNFs Disponibles */}
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <Typography
              variant="subtitle2"
              component="h4"
              sx={{
                fontWeight: 600,
                mb: 1.5,
                color: theme.palette.text.primary,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <SchoolIcon fontSize="small" color="primary" />
              PNFs Disponibles
            </Typography>

            <Stack 
              direction="row" 
              flexWrap="wrap" 
              gap={1}
              sx={{ 
                maxHeight: 120, // Altura máxima para los chips
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  width: 4,
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: theme.palette.grey[400],
                  borderRadius: 2,
                },
              }}
            >
              {sede.pnfs?.slice(0, 6).map((pnf, index) => (
                <Tooltip key={index} title={pnf.nombre_pnf} arrow>
                  <Chip
                    label={pnf.nombre_pnf}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ 
                      fontWeight: 500,
                      borderWidth: 1.5,
                      maxWidth: '100%',
                      '& .MuiChip-label': {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }
                    }}
                  />
                </Tooltip>
              ))}
              {sede.pnfs?.length > 6 && (
                <Chip
                  label={`+${sede.pnfs.length - 6} más`}
                  size="small"
                  color="default"
                  variant="outlined"
                />
              )}
              {(!sede.pnfs || sede.pnfs.length === 0) && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontStyle: 'italic' }}
                >
                  No hay PNFs asignados
                </Typography>
              )}
            </Stack>
          </Box>

          {/* Acciones - Siempre en la parte inferior */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            flexWrap: 'wrap',
            mt: 'auto', // Empuja los botones hacia abajo
            pt: 1,
          }}>
            <CustomButton
              variant="contained"
              startIcon={<VisibilityIcon />}
              fullWidth
              onClick={() => navigate(`/infraestructura/sedes/${sede.id_sede}/aulas`)}
              sx={{ 
                minHeight: 40,
                fontSize: '0.875rem',
              }}
            >
              Ver Núcleo
            </CustomButton>

            {sede.google_sede && (
              <Link
                href={sede.google_sede}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ textDecoration: 'none', width: '100%' }}
              >
                <CustomButton
                  variant="outlined"
                  startIcon={<LocationOnIcon />}
                  fullWidth
                  sx={{ 
                    minHeight: 40,
                    fontSize: '0.875rem',
                  }}
                >
                  Ubicación
                </CustomButton>
              </Link>
            )}
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
}