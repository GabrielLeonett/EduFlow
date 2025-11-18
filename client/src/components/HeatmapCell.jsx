import { interpolateReds } from "d3-scale-chromatic";
import { TableCell, Tooltip, Typography, Box } from "@mui/material";

function getHeatmapColor(value) {
  // Asegurar que el valor esté entre 0 y 1
  const normalizedValue = Math.min(Math.max(value, 0), 1);
  return interpolateReds(normalizedValue);
}

const HeatmapCell = ({ info }) => {
  // Si no hay información o densidad es 0, celda vacía
  if (!info || !info.densidad || parseFloat(info.densidad) === 0) {
    return (
      <TableCell
        sx={{
          minWidth: "20px !important",
          width: "20px !important",
          height: "20px !important",
          "&:hover": {
            backgroundColor: "#e9ecef",
          },
        }}
      />
    );
  }

  const densidad = parseFloat(info.densidad);
  const backgroundColor = getHeatmapColor(densidad);

  // Contenido del tooltip
  const tooltipContent = (
    <Box style={{ padding: "8px", fontSize: "0.8rem" }}>
      <Typography
        component={"p"}
        variant="caption"
        style={{ fontWeight: "bold", marginBottom: "4px" }}
      >
        {info.dia} - {info.hora_inicio} a {info.hora_fin}
      </Typography>
      <Typography component={"p"} variant="caption">
        Densidad: {(densidad * 100).toFixed(1)}%
      </Typography>
      <Typography component={"p"} variant="caption">
        Nivel: {info.nivel_ocupacion}
      </Typography>
      <Typography component={"p"} variant="caption">
        Horarios: {info.horarios_activos}
      </Typography>
      <Typography component={"p"} variant="caption">
        Aulas: {info.aulas_ocupadas}
      </Typography>
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} arrow enterDelay={500} leaveDelay={200}>
      <TableCell
        sx={{
          backgroundColor,
          minWidth: "80px !important",
          width: "80px !important",
          height: "10px !important",
          cursor: "pointer",
          transition: "all 0.2s ease",
          "&:hover": {
            transform: "scale(1.05)",
            zIndex: 10,
            boxShadow: "0 0 8px rgba(0,0,0,0.3)",
            position: "relative",
          },
        }}
      />
    </Tooltip>
  );
};

export default HeatmapCell;
