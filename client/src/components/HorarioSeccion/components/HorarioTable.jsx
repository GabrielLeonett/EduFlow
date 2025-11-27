import React from "react";
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
  Chip,
  useTheme,
  alpha,
  Tooltip,
} from "@mui/material";
import {
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  Class as ClassIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import Clase from "./clase";
import { UTILS } from "../../../utils/utils";

// Solo la tabla del horario
const HorarioTable = ({
  tableHorario,
  isSlotAvailable,
  handleSlotClick,
  handleMoveRequest,
  handleClassDeleteClick,
  handleCancelMoveRequest,
  selectedClass,
  Custom,
  UnidadesCurriculares,
  horarioTitle,
}) => {
  const theme = useTheme();

  // Ordenar las horas
  const horasOrdenadas = Object.keys(tableHorario[0]?.horas || {})
    .map(Number)
    .sort((a, b) => a - b);

  const getCellBackgroundColor = (dia_index, hora, celda, disponible) => {
    if (disponible) {
      return alpha(theme.palette.success.main, 0.1);
    }
    if (celda?.ocupado) {
      return alpha(theme.palette.primary.main, 0.05);
    }
    return "transparent";
  };

  const getCellBorderColor = (dia_index, hora, celda, disponible) => {
    if (disponible) {
      return theme.palette.success.main;
    }
    return theme.palette.divider;
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
                  width: { xs: 130, sm: 140, md: 150, lg: 160 },
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
                    {horarioTitle}
                  </Typography>

                  {/* Tooltip único para todas las unidades curriculares faltantes */}
                  {UnidadesCurriculares.length > 0 && (
                    <Tooltip
                      title={
                        <Box sx={{ p: 1, maxWidth: 300 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Estado de unidades curriculares:
                          </Typography>

                          {/* Unidades completas */}
                          {UnidadesCurriculares.filter(
                            (unidad) =>
                              unidad.esVista && !unidad.faltan_horas_clase
                          ).length > 0 && (
                            <Box sx={{ mb: 1 }}>
                              <Typography
                                variant="caption"
                                color="success.main"
                                fontWeight="bold"
                              >
                                ✅ Completas (
                                {
                                  UnidadesCurriculares.filter(
                                    (unidad) =>
                                      unidad.esVista &&
                                      !unidad.faltan_horas_clase
                                  ).length
                                }
                                )
                              </Typography>
                              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                {UnidadesCurriculares.filter(
                                  (unidad) =>
                                    unidad.esVista && !unidad.faltan_horas_clase
                                ).map((uc) => (
                                  <Typography
                                    component="li"
                                    variant="caption"
                                    key={uc.id_unidad_curricular}
                                    sx={{ mb: 0.5 }}
                                  >
                                    {uc.nombre_unidad_curricular} (
                                    {uc.horas_asignadas}h)
                                  </Typography>
                                ))}
                              </Box>
                            </Box>
                          )}

                          {/* Unidades incompletas */}
                          {UnidadesCurriculares.filter(
                            (unidad) =>
                              unidad.esVista && unidad.faltan_horas_clase
                          ).length > 0 && (
                            <Box sx={{ mb: 1 }}>
                              <Typography
                                variant="caption"
                                color="warning.main"
                                fontWeight="bold"
                              >
                                ⚠️ Incompletas (
                                {
                                  UnidadesCurriculares.filter(
                                    (unidad) =>
                                      unidad.esVista &&
                                      unidad.faltan_horas_clase
                                  ).length
                                }
                                )
                              </Typography>
                              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                {UnidadesCurriculares.filter(
                                  (unidad) =>
                                    unidad.esVista && unidad.faltan_horas_clase
                                ).map((uc) => (
                                  <Typography
                                    component="li"
                                    variant="caption"
                                    key={uc.id_unidad_curricular}
                                    sx={{ mb: 0.5 }}
                                  >
                                    {uc.nombre_unidad_curricular} (
                                    {uc.horas_asignadas}h de {uc.horas_clase}h)
                                  </Typography>
                                ))}
                              </Box>
                            </Box>
                          )}

                          {/* Unidades pendientes */}
                          {UnidadesCurriculares.filter(
                            (unidad) => !unidad.esVista
                          ).length > 0 && (
                            <Box>
                              <Typography
                                variant="caption"
                                color="error.main"
                                fontWeight="bold"
                              >
                                ❌ Pendientes (
                                {
                                  UnidadesCurriculares.filter(
                                    (unidad) => !unidad.esVista
                                  ).length
                                }
                                )
                              </Typography>
                              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                {UnidadesCurriculares.filter(
                                  (unidad) => !unidad.esVista
                                ).map((uc) => (
                                  <Typography
                                    component="li"
                                    variant="caption"
                                    key={uc.id_unidad_curricular}
                                    sx={{ mb: 0.5 }}
                                  >
                                    {uc.nombre_unidad_curricular} (
                                    {uc.horas_clase}h)
                                  </Typography>
                                ))}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      }
                      arrow
                      placement="top"
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          ml: 2,
                          cursor: "pointer",
                          borderRadius: 1,
                          px: 1,
                          py: 0.5,
                          backgroundColor:
                            UnidadesCurriculares.filter(
                              (unidad) => !unidad.esVista
                            ).length > 0
                              ? "error.light"
                              : UnidadesCurriculares.filter(
                                  (unidad) => unidad.faltan_horas_clase
                                ).length > 0
                              ? "warning.light"
                              : "success.light",
                          "&:hover": {
                            backgroundColor:
                              UnidadesCurriculares.filter(
                                (unidad) => !unidad.esVista
                              ).length > 0
                                ? "error.main"
                                : UnidadesCurriculares.filter(
                                    (unidad) => unidad.faltan_horas_clase
                                  ).length > 0
                                ? "warning.main"
                                : "success.main",
                          },
                        }}
                      >
                        {/* Icono dinámico según el estado */}
                        {UnidadesCurriculares.filter(
                          (unidad) => !unidad.esVista
                        ).length > 0 ? (
                          <InfoIcon
                            sx={{
                              fontSize: "1.2rem",
                              mr: 0.5,
                              color: "error.dark",
                            }}
                          />
                        ) : UnidadesCurriculares.filter(
                            (unidad) => unidad.faltan_horas_clase
                          ).length > 0 ? (
                          <WarningIcon
                            sx={{
                              fontSize: "1.2rem",
                              mr: 0.5,
                              color: "warning.dark",
                            }}
                          />
                        ) : (
                          <CheckCircleIcon
                            sx={{
                              fontSize: "1.2rem",
                              mr: 0.5,
                              color: "success.dark",
                            }}
                          />
                        )}

                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: "medium",
                            color:
                              UnidadesCurriculares.filter(
                                (unidad) => !unidad.esVista
                              ).length > 0
                                ? "error.dark"
                                : UnidadesCurriculares.filter(
                                    (unidad) => unidad.faltan_horas_clase
                                  ).length > 0
                                ? "warning.dark"
                                : "success.dark",
                          }}
                        >
                          {/* Mostrar solo las pendientes en el contador principal */}
                          {
                            UnidadesCurriculares.filter(
                              (unidad) => !unidad.esVista
                            ).length
                          }

                          {/* Opcional: Mostrar también las incompletas entre paréntesis */}
                          {UnidadesCurriculares.filter(
                            (unidad) => unidad.faltan_horas_clase
                          ).length > 0 && (
                            <span style={{ opacity: 0.7 }}>
                              {" "}
                              (+
                              {
                                UnidadesCurriculares.filter(
                                  (unidad) => unidad.faltan_horas_clase
                                ).length
                              }
                              )
                            </span>
                          )}
                        </Typography>
                      </Box>
                    </Tooltip>
                  )}
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
                  width: { xs: 130, sm: 140, md: 150, lg: 160 },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    backgroundColor: theme.palette.background.default,
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
                    width: { xs: 130, sm: 140, md: 150, lg: 160 },
                    textTransform: "capitalize",
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
              sx={{ "&:last-child td": { borderBottom: 0 } }}
              >
                {/* Celda de Hora */}
                <TableCell
                  sx={{
                    backgroundColor: theme.palette.grey[50],
                    border: `1px solid ${theme.palette.divider}`,
                    whiteSpace: "nowrap",
                    width: { xs: 130, sm: 140, md: 150, lg: 160 },
                    fontWeight: "medium",
                    position: "sticky",
                    left: 0,
                    zIndex: 1,
                    background: theme.palette.background.paper,
                  }}
                >
                  <Typography variant="body2" color="text.primary">
                    {UTILS.formatearHora(hora)} -{" "}
                    {UTILS.formatearHora(
                      Object.keys(UTILS.initialHours)[
                        Object.keys(UTILS.initialHours).map(Number).indexOf(hora) + 1
                      ]
                    )}
                  </Typography>
                </TableCell>

                {/* Celdas de cada día */}
                {tableHorario.map((columna, dia_index) => {
                  const celda = columna.horas[hora];
                  const cellKey = `${columna.dia}-${hora}`;
                  const disponible =
                    selectedClass && isSlotAvailable(dia_index, hora);

                  // Omitir celdas que no son el primer bloque de una clase
                  if (celda?.ocupado && celda.bloque !== 0) {
                    return null;
                  }

                  return (
                    <TableCell
                      key={cellKey}
                      rowSpan={celda?.ocupado ? celda.bloques_totales : 1}
                      sx={{
                        width: { xs: 130, sm: 140, md: 150, lg: 160 },
                        padding: 0,
                        verticalAlign: "top",
                        height: celda?.ocupado
                          ? `${celda.bloques_totales * 60}px`
                          : "60px",
                        border: `1px solid ${getCellBorderColor(
                          dia_index,
                          hora,
                          celda,
                          disponible
                        )}`,
                        backgroundColor: getCellBackgroundColor(
                          dia_index,
                          hora,
                          celda,
                          disponible
                        ),
                        position: "relative",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": disponible
                          ? {
                              backgroundColor: alpha(
                                theme.palette.success.main,
                                0.2
                              ),
                              cursor: "pointer",
                              transform: "scale(0.98)",
                              boxShadow: `0 0 0 2px ${theme.palette.success.main}`,
                            }
                          : {},
                      }}
                      onClick={() =>
                        disponible && handleSlotClick(dia_index, hora)
                      }
                    >
                      {celda?.ocupado ? (
                        <Clase
                          clase={celda.datos_clase}
                          {...(Custom && {
                            onMoveRequest: handleMoveRequest,
                            onCancelMove: handleCancelMoveRequest,
                            onDeleteClass: handleClassDeleteClick,
                            isSelected:
                              selectedClass?.id === celda.datos_clase?.id,
                          })}
                        />
                      ) : (
                        disponible && (
                          <Box
                            sx={{
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexDirection: "column",
                              gap: 0.5,
                              p: 1,
                            }}
                          >
                            <Chip
                              icon={<ClassIcon sx={{ fontSize: "1rem" }} />}
                              label="Disponible"
                              size="mediun"
                              color="success"
                              variant="outlined"
                            />
                          </Box>
                        )
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
