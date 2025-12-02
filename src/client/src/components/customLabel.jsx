import { TextField } from "@mui/material";
import { useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";

// Versión con styled components (recomendada)
const StyledTextField = styled(TextField)(({ theme }) => ({
  width: "100%",
  maxWidth: "100%",
  "& .MuiInputLabel-root": {
    color: theme.palette.text.secondary,
    fontWeight: theme.typography.fontWeightMedium,
    "&.Mui-focused": {
      color: theme.palette.primary.main,
    },
    "&.Mui-error": {
      color: theme.palette.error.main,
    },
  },
  "& .MuiOutlinedInput-root": {
    width: "100%", // ← IMPORTANTE
    borderRadius: "10px",
    backgroundColor: theme.palette.background.paper,

    "& fieldset": {
      borderColor: theme.palette.divider,
      borderWidth: 1.5,
      transition: theme.transitions.create(["border-color"], {
        duration: theme.transitions.duration.shorter,
      }),
    },
    "&:hover fieldset": {
      borderColor: theme.palette.primary.light,
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
    },
    "&.Mui-error": {
      "& fieldset": {
        borderColor: theme.palette.error.light,
      },
      "&:hover fieldset": {
        borderColor: theme.palette.error.main,
      },
      "&.Mui-focused fieldset": {
        borderColor: theme.palette.error.main,
      },
    },
    "&.Mui-disabled": {
      backgroundColor: theme.palette.action.disabledBackground,
      "& fieldset": {
        borderColor: theme.palette.action.disabled,
      },
      "& .MuiInputLabel-root": {
        color: theme.palette.text.disabled,
      },
    },
  },
  "& .MuiOutlinedInput-input": {
    width: "100%", // ← IMPORTANTE
    color: theme.palette.text.primary,
    padding: theme.spacing(1.5, 2),
    fontSize: theme.typography.body1.fontSize,
    "&::placeholder": {
      color: theme.palette.text.disabled,
      opacity: 1,
    },
  },
  "& .MuiFormHelperText-root": {
    margin: theme.spacing(0.5, 0, 0),
    fontSize: theme.typography.caption.fontSize,
    "&.Mui-error": {
      color: theme.palette.error.main,
    },
  },
}));

// Versión con sx prop (alternativa)
export default function CustomLabel({ sx = {}, ...props }) {
  const theme = useTheme();

  return (
    <TextField
      sx={{
        "& .MuiInputLabel-root": {
          color: theme.palette.text.secondary,
          fontWeight: theme.typography.fontWeightMedium,
          "&.Mui-focused": {
            color: theme.palette.primary.main,
          },
          "&.Mui-error": {
            color: theme.palette.error.main,
          },
        },
        "& .MuiOutlinedInput-root": {
          borderRadius: theme.shape.borderRadius, // ← Redondeo del CONTENEDOR
          backgroundColor: theme.palette.background.paper,

          "& fieldset": {
            borderColor: theme.palette.grey[300],
            borderWidth: 1.5,
            borderRadius: theme.shape.borderRadius, // ← ⭐ AÑADE ESTA LÍNEA
            transition: theme.transitions.create(["border-color"], {
              duration: theme.transitions.duration.shorter,
            }),
          },
          "&:hover fieldset": {
            borderColor: theme.palette.primary.light,
            borderRadius: theme.shape.borderRadius, // ← ⭐ Y AQUÍ TAMBIÉN
          },
          "&.Mui-focused fieldset": {
            borderColor: theme.palette.primary.main,
            borderWidth: 2,
            borderRadius: theme.shape.borderRadius, // ← ⭐ Y AQUÍ TAMBIÉN
          },
          "&.Mui-error": {
            "& fieldset": {
              borderColor: theme.palette.error.light,
              borderRadius: theme.shape.borderRadius, // ← ⭐ Y AQUÍ TAMBIÉN
            },
            "&:hover fieldset": {
              borderColor: theme.palette.error.main,
              borderRadius: theme.shape.borderRadius, // ← ⭐ Y AQUÍ TAMBIÉN
            },
            "&.Mui-focused fieldset": {
              borderColor: theme.palette.error.main,
              borderRadius: theme.shape.borderRadius, // ← ⭐ Y AQUÍ TAMBIÉN
            },
          },
          "&.Mui-disabled": {
            backgroundColor: theme.palette.action.disabledBackground,
            "& fieldset": {
              borderColor: theme.palette.action.disabled,
              borderRadius: theme.shape.borderRadius, // ← ⭐ Y AQUÍ TAMBIÉN
            },
            "& .MuiInputLabel-root": {
              color: theme.palette.text.disabled,
            },
          },
        },
        "& .MuiOutlinedInput-input": {
          color: theme.palette.text.primary,
          padding: theme.spacing(1.5, 2),
          fontSize: theme.typography.body1.fontSize,
          "&::placeholder": {
            color: theme.palette.text.disabled,
            opacity: 1,
          },
        },
        "& .MuiFormHelperText-root": {
          margin: theme.spacing(0.5, 0, 0),
          fontSize: theme.typography.caption.fontSize,
          "&.Mui-error": {
            color: theme.palette.error.main,
          },
        },
        ...sx,
      }}
      {...props}
    />
  );
}

// Versión específica para formularios con variantes
export const FormTextField = styled(StyledTextField)(
  ({ theme, variantType = "default" }) => {
    const variants = {
      default: {},
      filled: {
        "& .MuiOutlinedInput-root": {
          backgroundColor: theme.palette.grey[50],
          "&:hover": {
            backgroundColor: theme.palette.grey[100],
          },
        },
      },
      transparent: {
        "& .MuiOutlinedInput-root": {
          backgroundColor: "transparent",
        },
      },
    };

    return variants[variantType];
  }
);

// Exporta ambas versiones
export { StyledTextField };
