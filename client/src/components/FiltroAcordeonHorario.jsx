// components/FiltroAcordeonHorario.jsx
import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useApi from "../hook/useApi";

export default function FiltroAcordeonHorario({
  onSeccionSelect,
}) {
  const axios = useApi();
  const theme = useTheme();
  const [pnfs, setPnfs] = useState([]);
  const [expandedPnf, setExpandedPnf] = useState(null);
  const [expandedTrayectos, setExpandedTrayectos] = useState({});

  // Cargar PNFs
  useEffect(() => {
    const fetchPnfs = async () => {
      try {
        const res = await axios.get("/pnf");
        setPnfs(res.pnfs || []);
      } catch (error) {
        console.error("Error cargando PNFs:", error);
      }
    };

    fetchPnfs();
  }, [axios]);

  // Manejar expansión de PNF
  const handlePnfExpand = async (pnfId, pnfCodigo) => {
    setExpandedPnf(expandedPnf === pnfId ? null : pnfId);

    // Si se expande, cargar trayectos
    if (expandedPnf !== pnfId) {
      await fetchTrayectos(pnfId, pnfCodigo);
    }
  };

  // Manejar expansión de trayecto
  const handleTrayectoExpand = async (trayectoId, pnfId, pnfCodigo) => {
    setExpandedTrayectos((prev) => ({
      ...prev,
      [trayectoId]: !prev[trayectoId],
    }));

    // Si se expande, cargar secciones
    if (!expandedTrayectos[trayectoId]) {
      await fetchSecciones(trayectoId, pnfId, pnfCodigo);
    }
  };

  // Cargar trayectos de un PNF
  const fetchTrayectos = async (pnfId, pnfCodigo) => {
    try {
      const response = await axios.get(`/pnf/${pnfCodigo}/trayectos`);
      console.log("Trayectos recibidos:", response);

      setPnfs((prev) =>
        prev.map((pnf) =>
          pnf.id_pnf === pnfId
            ? { ...pnf, trayectos: response.trayectos || [] }
            : pnf
        )
      );
    } catch (error) {
      console.error("Error cargando trayectos:", error);
    }
  };

  // Cargar secciones de un trayecto
  const fetchSecciones = async (trayectoId, pnfId) => {
    try {
      const response = await axios.get(`/trayectos/${trayectoId}/secciones`);
      console.log("Secciones recibidas:", response.secciones);
      setPnfs((prev) =>
        prev.map((pnf) =>
          pnf.id_pnf === pnfId
            ? {
                ...pnf,
                trayectos:
                  pnf.trayectos?.map((trayecto) =>
                    trayecto.id_trayecto === trayectoId
                      ? { ...trayecto, secciones: response.secciones || [] }
                      : trayecto
                  ) || [],
              }
            : pnf
        )
      );
    } catch (error) {
      console.error("Error cargando secciones:", error);
    }
  };

  // Manejar selección de sección
  const handleSeccionClick = (seccion) => {
    if (onSeccionSelect) {
      onSeccionSelect(seccion);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 800,
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
        p: 2,
      }}
    >
      {pnfs.map((pnf) => (
        <Accordion
          key={pnf.id_pnf}
          expanded={expandedPnf === pnf.id_pnf}
          onChange={() => handlePnfExpand(pnf.id_pnf, pnf.codigo_pnf)}
          sx={{
            mb: 1,
            borderRadius: `${theme.shape.borderRadius}px !important`,
            "&:before": {
              display: "none",
            },
            boxShadow: theme.shadows[1],
            "&:hover": {
              boxShadow: theme.shadows[2],
            },
            transition: theme.transitions.create(["box-shadow"], {
              duration: theme.transitions.duration.short,
            }),
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              "& .MuiAccordionSummary-expandIconWrapper": {
                color: theme.palette.primary.main,
              },
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  flex: 1,
                  color: theme.palette.text.primary,
                }}
              >
                {pnf.nombre_pnf}
              </Typography>
            </Box>
          </AccordionSummary>

          <AccordionDetails sx={{ p: 0 }}>
            {pnf.trayectos?.map((trayecto) => (
              <Accordion
                key={trayecto.id_trayecto}
                expanded={expandedTrayectos[trayecto.id_trayecto] || false}
                onChange={() =>
                  handleTrayectoExpand(
                    trayecto.id_trayecto,
                    pnf.id_pnf,
                    pnf.codigo_pnf
                  )
                }
                sx={{
                  m: 0,
                  "&:before": { display: "none" },
                  boxShadow: "none",
                  border: "none",
                  borderRadius: "0 !important",
                  "&:last-of-type": {
                    borderBottomLeftRadius: `${theme.shape.borderRadius}px !important`,
                    borderBottomRightRadius: `${theme.shape.borderRadius}px !important`,
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    backgroundColor: theme.palette.background.paper,
                    borderBottom: `1px solid ${theme.palette.grey[200]}`,
                    "&:hover": {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <Typography component={"h5"} variant="body1">
                      Trayecto {trayecto.valor_trayecto}
                    </Typography>
                  </Box>
                </AccordionSummary>

                <AccordionDetails
                  sx={{
                    p: 1,
                    backgroundColor: theme.palette.background.default,
                  }}
                >
                  {trayecto.secciones?.map((seccion) => (
                    <Box
                      key={seccion.id_seccion}
                      onClick={() => handleSeccionClick(seccion)}
                      sx={{
                        p: 2,
                        m: 1,
                        backgroundColor: theme.palette.background.paper,
                        border: "1px solid",
                        cursor: "pointer",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          fontWeight="medium"
                          color={theme.palette.text.primary}
                        >
                          Sección {seccion.valor_seccion}
                        </Typography>
                      </Box>

                      <Typography
                        variant="body2"
                        color={theme.palette.text.secondary}
                      >
                        Turno: {seccion.nombre_turno}
                      </Typography>
                    </Box>
                  ))}

                  {(!trayecto.secciones || trayecto.secciones.length === 0) && (
                    <Typography
                      variant="body2"
                      color={theme.palette.text.secondary}
                      textAlign="center"
                      sx={{ p: 2 }}
                    >
                      No hay secciones registradas para este trayecto
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}

            {(!pnf.trayectos || pnf.trayectos.length === 0) && (
              <Typography
                variant="body2"
                color={theme.palette.text.secondary}
                textAlign="center"
                sx={{ p: 2 }}
              >
                No hay trayectos registrados para este PNF
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
      ))}

      {pnfs.length === 0 && (
        <Typography
          textAlign="center"
          color={theme.palette.text.secondary}
          sx={{ p: 3 }}
        >
          No hay PNFs registrados
        </Typography>
      )}
    </Box>
  );
}
