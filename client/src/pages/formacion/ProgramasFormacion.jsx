import { useEffect, useState } from "react";
import ResponsiveAppBar from "../../components/navbar";
import { Typography, Box, CircularProgress, Tooltip } from "@mui/material";
import CardPNF from "../../components/cardPNF";
import LoadingCharge from "../../components/ui/LoadingCharge";
import useApi from "../../hook/useApi"; // Added import for axios
import CustomButton from "../../components/customButton";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";

export default function ProgramasFormacion() {
  const navigate = useNavigate();
  const [PNFS, setPNFS] = useState([]);
  const [loading, setLoading] = useState(true);
  const axios = useApi();

  useEffect(() => {
    const fetchPNFS = async () => {
      const { pnfs } = await axios.get("/pnf");
      console.log(pnfs);
      setPNFS(pnfs);
      setLoading(false);
    };

    fetchPNFS();
  }, [axios]);

  return (
    <>
      <ResponsiveAppBar backgroundColor />

      <Box sx={{ pt: 12, px: 5 }}>
        <Typography component="h1" variant="h4" sx={{ mt: 4, mr: 4 }}>
          Programas Nacionales de Formación (PNF)
        </Typography>

        {loading ? (
          <LoadingCharge charge={loading} />
        ) : (
          <Box>
            {PNFS.map((PNF) => (
              <CardPNF
                key={PNF.codigo_pnf} // Asegúrate de tener una key única
                PNF={PNF}
              />
            ))}
          </Box>
        )}
        <Tooltip title={"Registrar PNF"} placement="left-start">
          <CustomButton
            onClick={() => {
              navigate('/formacion/programas/registrar');
            }}
            sx={{
              position: "fixed",
              bottom: 78,
              right: 24,
              minWidth: "auto",
              width: 48,
              height: 48,
              borderRadius: "50%",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label={"Registrar PNF"}
          >
            <AddIcon />
          </CustomButton>
        </Tooltip>
      </Box>
    </>
  );
}
