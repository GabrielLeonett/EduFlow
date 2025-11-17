import {
  Card,
  CardContent,
  Box,
  Typography,
  Divider,
} from "@mui/material";
import {
  AccessTime,
  LocationOn,
  Code,
  Group
} from "@mui/icons-material";
import CustomButton from "./customButton";
import CustomChip from "./CustomChip";
import { useNavigate } from "react-router-dom";

export default function CardAula({ aula }) {
  const navigate = useNavigate();
  // Función para obtener el color de la sede
  const getSedeColor = (idSede) => {
    const colors = {
      1: "primary",
      2: "secondary",
      3: "success",
      4: "warning",
      5: "error"
    };
    return colors[idSede] || "default";
  };



  // Función para obtener iniciales del código del aula
  const getInitials = (codigo) => {
    return `A${codigo}`.substring(0, 3);
  };

  return (
    <Card
      elevation={2}
      sx={{
        width: { xs: "100%", sm: 300, md: 300 },
        borderRadius: "16px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
        transition: "transform 0.2s, box-shadow 0.2s",
        ":hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        },
        height: "100%",
        cursor: "pointer",
      }}
      onClick={() => onGestionarAula && onGestionarAula(aula)}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header con avatar e información básica */}
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Box flex={1}>
            <Typography variant="h6" fontWeight={600} noWrap>
              {aula.codigo_aula}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
              {aula.nombre_sede}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              <Code sx={{ fontSize: 14, mr: 0.5 }} />
              ID: {aula.id_aula}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Información del aula */}
        <Box mb={2}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="caption" color="text.secondary">
              Código:
            </Typography>
            <CustomChip
              label={aula.codigo_aula}
              color="primary"
              size="small"
              icon={<Code sx={{ fontSize: 14 }} />}
            />
          </Box>

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="caption" color="text.secondary">
              Sede:
            </Typography>
            <CustomChip
              label={aula.nombre_sede}
              color={getSedeColor(aula.id_sede)}
              size="small"
              icon={<LocationOn sx={{ fontSize: 14 }} />}
            />
          </Box>

          {/* Espacio para información adicional que puedas agregar después */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="caption" color="text.secondary">
              Estado:
            </Typography>
            <CustomChip
              label="Disponible"
              color="success"
              size="small"
            />
          </Box>
        </Box>

        {/* Sección de estadísticas (puedes personalizar según tus necesidades) */}
        <Box mb={2}>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            mb={1}
          >
            Información:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            <CustomChip
              icon={<Group sx={{ fontSize: 16 }} />}
              label={`${aula.capacidad_aula || 0} personas`}
              size="small"
              variant="outlined"
              color="secondary"
              sx={{ fontSize: "0.7rem" }}
            />
            <CustomChip
              label={aula.tipo_aula || "N/A"}
              variant="outlined"
              color="primary"
              size="small"
              sx={{ fontSize: "0.7rem" }}
            />
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        <CustomButton
          onClick={() => navigate(`/horarios/aulas/${aula.id_aula}`)}
        >
          <AccessTime />
          Ver Horario
        </CustomButton>
      </CardContent>
    </Card >
  );
}