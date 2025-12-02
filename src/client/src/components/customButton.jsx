import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";
import { styled } from "@mui/material/styles";

// Versión con styled components
const StyledButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "tipo",
})(({ theme, tipo = "primary" }) => {
  const getButtonStyles = () => {
    const baseStyles = {
      padding: theme.spacing(1, 2),
      borderRadius: theme.spacing(1.5),
      fontWeight: theme.typography.fontWeightMedium,
      textTransform: "none",
      transition: theme.transitions.create(["all"], {
        duration: theme.transitions.duration.shorter,
        easing: theme.transitions.easing.easeInOut,
      }),
      boxShadow: "none",
      "&:hover": {
        boxShadow: theme.shadows[2],
        transform: "translateY(-1px)",
      },
      "&:active": {
        transform: "translateY(0)",
      },
      "&.Mui-disabled": {
        backgroundColor: theme.palette.action.disabledBackground,
        color: theme.palette.action.disabled,
        border: "none",
      },
    };

    const variants = {
      primary: {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        "&:hover": {
          backgroundColor: theme.palette.primary.dark,
          boxShadow: theme.shadows[4],
        },
      },
      secondary: {
        backgroundColor: theme.palette.secondary.main,
        color: theme.palette.secondary.contrastText,
        "&:hover": {
          backgroundColor: theme.palette.secondary.dark,
        },
      },
      outlined: {
        backgroundColor: "transparent",
        color: theme.palette.primary.main,
        border: `1.5px solid ${theme.palette.primary.main}`,
        "&:hover": {
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        },
      },
      // ✅ NUEVA VARIANTE FILLED
      filled: {
        backgroundColor: theme.palette.grey[100],
        color: theme.palette.text.primary,
        border: `1px solid ${theme.palette.divider}`,
        "&:hover": {
          backgroundColor: theme.palette.grey[200],
          borderColor: theme.palette.grey[400],
        },
        "&:active": {
          backgroundColor: theme.palette.grey[300],
        },
      },
      text: {
        backgroundColor: "transparent",
        color: theme.palette.primary.main,
        border: "none",
        "&:hover": {
          backgroundColor: theme.palette.action.hover,
        },
      },
      success: {
        backgroundColor: theme.palette.success.main,
        color: theme.palette.success.contrastText,
        "&:hover": {
          backgroundColor: theme.palette.success.dark,
        },
      },
      error: {
        backgroundColor: theme.palette.error.main,
        color: theme.palette.error.contrastText,
        "&:hover": {
          backgroundColor: theme.palette.error.dark,
        },
      },
      warning: {
        backgroundColor: theme.palette.warning.main,
        color: theme.palette.warning.contrastText,
        "&:hover": {
          backgroundColor: theme.palette.warning.dark,
        },
      },
      info: {
        backgroundColor: theme.palette.info.main,
        color: theme.palette.info.contrastText,
        "&:hover": {
          backgroundColor: theme.palette.info.dark,
        },
      },
    };

    return {
      ...baseStyles,
      ...variants[tipo],
    };
  };

  return getButtonStyles();
});

// Versión con sx prop
export default function CustomButton({ tipo = "primary", sx = {}, ...props }) {
  const theme = useTheme();

  const getButtonStyles = () => {
    const baseStyles = {
      padding: theme.spacing(1, 2),
      borderRadius: theme.spacing(1.5),
      fontWeight: theme.typography.fontWeightMedium,
      textTransform: "none",
      transition: theme.transitions.create(["all"], {
        duration: theme.transitions.duration.shorter,
        easing: theme.transitions.easing.easeInOut,
      }),
      boxShadow: "none",
      "&:hover": {
        boxShadow: theme.shadows[2],
        transform: "translateY(-1px)",
      },
      "&:active": {
        transform: "translateY(0)",
      },
      "&.Mui-disabled": {
        backgroundColor: theme.palette.action.disabledBackground,
        color: theme.palette.action.disabled,
        border: "none",
      },
    };

    const variants = {
      primary: {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        "&:hover": {
          backgroundColor: theme.palette.primary.dark,
          boxShadow: theme.shadows[4],
        },
      },
      secondary: {
        backgroundColor: theme.palette.secondary.main,
        color: theme.palette.secondary.contrastText,
        "&:hover": {
          backgroundColor: theme.palette.secondary.dark,
        },
      },
      outlined: {
        backgroundColor: "transparent",
        color: theme.palette.primary.main,
        border: `1.5px solid ${theme.palette.primary.main}`,
        "&:hover": {
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        },
      },
      // ✅ NUEVA VARIANTE FILLED
      filled: {
        backgroundColor: theme.palette.grey[100],
        color: theme.palette.text.primary,
        border: `1px solid ${theme.palette.divider}`,
        "&:hover": {
          backgroundColor: theme.palette.grey[200],
          borderColor: theme.palette.grey[400],
          boxShadow: theme.shadows[1],
        },
        "&:active": {
          backgroundColor: theme.palette.grey[300],
        },
      },
      text: {
        backgroundColor: "transparent",
        color: theme.palette.primary.main,
        border: "none",
        "&:hover": {
          backgroundColor: theme.palette.action.hover,
        },
      },
      success: {
        backgroundColor: theme.palette.success.main,
        color: theme.palette.success.contrastText,
        "&:hover": {
          backgroundColor: theme.palette.success.dark,
        },
      },
      error: {
        backgroundColor: theme.palette.error.main,
        color: theme.palette.error.contrastText,
        "&:hover": {
          backgroundColor: theme.palette.error.dark,
        },
      },
      warning: {
        backgroundColor: theme.palette.warning.main,
        color: theme.palette.warning.contrastText,
        "&:hover": {
          backgroundColor: theme.palette.warning.dark,
        },
      },
      info: {
        backgroundColor: theme.palette.info.main,
        color: theme.palette.info.contrastText,
        "&:hover": {
          backgroundColor: theme.palette.info.dark,
        },
      },
    };

    return {
      ...baseStyles,
      ...variants[tipo],
      ...sx,
    };
  };

  // Elige una versión:
  // return <StyledButton tipo={tipo} sx={sx} {...props} />;
  return <Button sx={getButtonStyles()} {...props} />;
}