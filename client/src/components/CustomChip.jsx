import { Chip, useTheme } from "@mui/material";
import { Cancel } from "@mui/icons-material";

export default function CustomChip({
  label,
  onDelete,
  deletable = false,
  color = "default",
  variant = "filled",
  size = "medium",
}) {
  const theme = useTheme();

  return (
    <Chip
      label={label}
      onDelete={deletable ? onDelete : undefined}
      deleteIcon={deletable ? <Cancel /> : undefined}
      color={color}
      variant={variant}
      size={size}
      sx={{
        maxWidth: "100%",
        margin: "2px",
        fontWeight: theme.typography.fontWeightMedium,
        transition: "all 0.3s ease",
        ...(variant === "outlined" && {
          borderColor: theme.palette[color].main,
          color: theme.palette[color].main,
          "&:hover": {
            backgroundColor: theme.palette[color].light,
            color: theme.palette[color].dark,
          },
        }),
        ...(deletable && {
          "&:hover": {
            backgroundColor:
              variant === "filled"
                ? theme.palette[color].dark
                : theme.palette[color].light,
            transform: "scale(1.05)",
            boxShadow: theme.shadows[2],
          },
          "& .MuiChip-deleteIcon": {
            color: theme.palette.error.main,
            transition: "all 0.3s ease",
            "&:hover": {
              color: theme.palette.error.dark,
              transform: "scale(1.2)",
            },
          },
        }),
      }}
    />
  );
}
