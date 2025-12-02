import { Skeleton, Card, CardContent } from "@mui/material";

export default function SkeletonHorario() {
  return (
    <Card sx={{ width: 400, m: 2, boxShadow: 5 }}>
      <Skeleton sx={{ height: 300 }} animation="wave" variant="rectangular" />
      <CardContent>
        <Skeleton
          animation="wave"
          variant="rectangular"
          height={60}
          sx={{ mb: 1 }}
        />
        <Skeleton
          animation="wave"
          variant="rectangular"
          height={60}
          sx={{ mb: 1 }}
        />
        <Skeleton
          animation="wave"
          variant="rectangular"
          height={60}
          sx={{ mb: 1 }}
        />
        <Skeleton
          animation="wave"
          variant="rectangular"
          height={60}
          sx={{ mb: 1 }}
        />
      </CardContent>
    </Card>
  );
}
