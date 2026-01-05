import { Autocomplete, TextField } from "@mui/material";
import CustomLabel from "./customLabel";
import { useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";

// Versión con styled components mejorada
const StyledAutocomplete = styled(Autocomplete)(({ theme }) => ({
  width: "100%",
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
    borderRadius: "10px",
    backgroundColor: theme.palette.background.paper,
    "& fieldset": {
      borderColor: theme.palette.divider,
      borderWidth: 1.5,
      borderRadius: "10px", // ← Asegurar aquí también
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
    },
  },
  "& .MuiInputLabel-root.Mui-disabled": {
    color: theme.palette.text.disabled,
  },
}));

// Componente principal mejorado
export default function CustomAutocomplete({ 
  sx = {}, 
  variantType = "default",
  ...props 
}) {
  const theme = useTheme();

  const getVariantStyles = () => {
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
  };

  return (
    <StyledAutocomplete
      sx={{
        ...getVariantStyles(),
        ...sx,
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          // Props adicionales del TextField si necesitas
        />
      )}
      {...props}
    />
  );
}

// Versión específica para formularios
export const FormAutocomplete = styled(StyledAutocomplete)(
  ({ theme, varianttype = "default" }) => {
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

    return variants[varianttype];
  }
);

// Exporta los componentes
export { StyledAutocomplete };