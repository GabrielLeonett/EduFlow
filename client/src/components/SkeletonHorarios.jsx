import Skeleton from "@mui/material/Skeleton";
import Box from "@mui/material/Box";

export default function SkeletonHorario() {
  return (
    <Box>
      <Skeleton
        sx={{ bgcolor: "grey.900" }}
        variant="rectangular"
        width={1000}
        height={600}
      />
    </Box>
  );
}
