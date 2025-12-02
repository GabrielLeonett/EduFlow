import { Box } from "@mui/material";
import LogoSimple from "./logoSimple";
export default function LoadingCharge({charge}) {
  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignContent: "center",
        zIndex: 9999,
      }}
    >
      <LogoSimple animacion={charge}></LogoSimple>
    </Box>
  );
}
