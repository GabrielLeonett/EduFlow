import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  useTheme,
  Chip,
} from "@mui/material";

import {
  Schedule as ScheduleIcon,
  Class as ClassIcon,
} from "@mui/icons-material";
import Clase from "./clase";
import { UTILS } from "../../../utils/utils";

// Solo la tabla del horario
const HorarioTable = ({ aula, tableHorario, Custom }) => {
  const theme = useTheme();

  // Ordenar las horas
  const horasOrdenadas = Object.keys(tableHorario[0]?.horas || {})
    .map(Number)
    .sort((a, b) => a - b);

  const getHeaderTitle = () => {
    const parts = [];
    if (aula?.codigo_aula) {
      parts.push(`Aula: ${aula.codigo_aula}`);
    }
    return parts.join(" • ");
  };

  return (
    <Paper
      elevation={2}
      sx={{
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <TableContainer>
        <Table sx={{ minWidth: 1000 }} size="small">
          {/* Header Principal */}
          <TableHead>
            <TableRow>
              <TableCell
                colSpan={7}
                align="center"
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  py: 2,
                  borderBottom: `2px solid ${theme.palette.primary.dark}`,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                  }}
                >
                  <ClassIcon />
                  <Typography variant="h6" component="div" fontWeight="bold">
                    {getHeaderTitle()}
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>

            {/* Header de Días */}
            <TableRow>
              <TableCell
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  fontWeight: "bold",
                  backgroundColor: theme.palette.background.default,
                  width: 120,
                  position: "sticky",
                  left: 0,
                  zIndex: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <ScheduleIcon fontSize="small" />
                  <span>Hora</span>
                </Box>
              </TableCell>
              {tableHorario.map((columna) => (
                <TableCell
                  key={columna.dia}
                  align="center"
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.default,
                    fontWeight: "bold",
                    textTransform: "capitalize",
                    minWidth: 140,
                  }}
                >
                  {columna.dia}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {horasOrdenadas.map((hora) => (
              <TableRow
                key={hora}
                sx={{
                  "&:last-child td": { borderBottom: 0 },
                  height: "60px",
                }}
              >
                {/* Celda de Hora */}
                <TableCell
                  sx={{
                    backgroundColor: theme.palette.grey[50],
                    border: `1px solid ${theme.palette.divider}`,
                    whiteSpace: "nowrap",
                    fontWeight: "medium",
                    position: "sticky",
                    left: 0,
                    zIndex: 1,
                    background: theme.palette.background.paper,
                    height: "60px",
                  }}
                >
                  <Typography variant="body2" color="text.primary">
                    {UTILS.formatearHora(hora)}
                  </Typography>
                </TableCell>

                {/* Celdas de cada día */}
                {tableHorario.map((columna) => {
                  const celda = columna.horas[hora];
                  const cellKey = `${columna.dia}-${hora}`;

                  // Si la celda está ocupada pero no es el primer bloque, mostrar celda vacía
                  if (celda?.ocupado && celda.bloque !== 0) {
                    return (
                      <TableCell
                        key={cellKey}
                        sx={{
                          padding: 0,
                          verticalAlign: "top",
                          height: "60px",
                          minWidth: 140,
                          border: `1px solid ${theme.palette.divider}`,
                          backgroundColor: theme.palette.action.hover,
                        }}
                      >
                        {/* Celda ocupada por continuación de clase - se deja vacía */}
                      </TableCell>
                    );
                  }

                  return (
                    <TableCell
                      key={cellKey}
                      rowSpan={celda?.ocupado ? celda.bloques_totales : 1}
                      sx={{
                        padding: 0,
                        verticalAlign: "top",
                        height: celda?.ocupado
                          ? `${celda.bloques_totales * 60}px`
                          : "60px",
                        minWidth: 140,
                        border: `1px solid ${theme.palette.divider}`,
                        position: "relative",
                        transition: "all 0.2s ease-in-out",
                        backgroundColor: celda?.ocupado
                          ? "transparent"
                          : theme.palette.background.paper,
                      }}
                    >
                      {celda?.ocupado ? (
                        <Clase clase={celda.datos_clase} {...Custom} />
                      ) : (
                        // Celda vacía con estilo sutil
                        <></>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default HorarioTable;
