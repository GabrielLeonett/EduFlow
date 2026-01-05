import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import "dayjs/locale/es";
import dayjs from "dayjs";
import { useTheme } from "@mui/material/styles";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";

// Versión con styled components (recomendada)
const StyledDatePicker = styled(DatePicker)(({ theme, error }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
    transition: theme.transitions.create(["border-color", "box-shadow"], {
      duration: theme.transitions.duration.shorter,
    }),

    "& fieldset": {
      borderColor: theme.palette.divider,
      borderWidth: 1.5,
    },
    "&:hover fieldset": {
      borderColor: theme.palette.primary.light,
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
    },
    ...(error && {
      "& fieldset": {
        borderColor: theme.palette.error.light,
      },
      "&:hover fieldset": {
        borderColor: theme.palette.error.main,
      },
      "&.Mui-focused fieldset": {
        borderColor: theme.palette.error.main,
      },
    }),
  },

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

  "& .MuiSvgIcon-root": {
    color: theme.palette.action.active,
    "&:hover": {
      color: theme.palette.primary.main,
    },
  },

  "& .MuiPickersDay-root": {
    borderRadius: theme.shape.borderRadius / 2,
    fontWeight: theme.typography.fontWeightMedium,

    "&:hover": {
      backgroundColor: theme.palette.primary.light,
      color: theme.palette.primary.contrastText,
    },
    "&.Mui-selected": {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      "&:hover": {
        backgroundColor: theme.palette.primary.dark,
      },
    },
    "&.Mui-disabled": {
      color: theme.palette.text.disabled,
    },
  },

  "& .MuiPickersCalendarHeader-root": {
    "& .MuiIconButton-root": {
      color: theme.palette.primary.main,
      "&:hover": {
        backgroundColor: theme.palette.action.hover,
      },
    },
  },

  "& .MuiDayCalendar-weekDayLabel": {
    color: theme.palette.text.secondary,
    fontWeight: theme.typography.fontWeightMedium,
  },

  "& .MuiYearCalendar-root": {
    "& .MuiPickersYear-yearButton": {
      "&:hover": {
        backgroundColor: theme.palette.primary.light,
        color: theme.palette.primary.contrastText,
      },
      "&.Mui-selected": {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
      },
    },
  },
}));

// Componente principal
const CustomCalendar = ({ error = false, helperText, sx = {}, ...props }) => {
  const theme = useTheme();

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <StyledDatePicker
        {...props}
        error={error}
        localeText={{
          // Botones de acción
          todayButtonLabel: "Hoy",
          clearButtonLabel: "Limpiar",
          cancelButtonLabel: "Cancelar",
          okButtonLabel: "Aceptar",

          // Placeholders como funciones (para versiones más recientes)
          fieldMonthPlaceholder: () => "MM",
          fieldDayPlaceholder: () => "DD", 
          fieldYearPlaceholder: () => "AAAA",

          // Navegación
          previousMonth: "Mes anterior",
          nextMonth: "Mes siguiente",

          // Funciones
          calendarViewSwitchingButtonAriaLabel: (view) =>
            view === "year"
              ? "la vista de año está abierta, cambie a la vista de calendario"
              : "la vista de calendario está abierta, cambie a la vista de año",
        }}
        slotProps={{
          textField: {
            error: error,
            helperText: helperText,
            fullWidth: true,
            sx: {
              "& .MuiFormHelperText-root": {
                margin: theme.spacing(0.5, 0, 0),
                fontSize: theme.typography.caption.fontSize,
                "&.Mui-error": {
                  color: theme.palette.error.main,
                },
              },
              ...sx,
            },
          },
          actionBar: {
            actions: ["today", "clear"],
          },
        }}
        sx={{
          width: "100%",
          "& .MuiOutlinedInput-input": {
            padding: theme.spacing(1.5, 2),
            fontSize: theme.typography.body1.fontSize,
          },
        }}
      />
    </LocalizationProvider>
  );
};

// Versión alternativa SIN localeText (más segura)
export function CustomCalendarSX({ sx = {}, ...props }) {
  const theme = useTheme();

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <DatePicker
        maxDate={dayjs()}
        sx={{
          width: "100%",

          "& .MuiOutlinedInput-root": {
            borderRadius: theme.shape.borderRadius,
            backgroundColor: theme.palette.background.paper,
            transition: theme.transitions.create(
              ["border-color", "box-shadow"],
              {
                duration: theme.transitions.duration.shorter,
              }
            ),

            "& fieldset": {
              borderColor: theme.palette.divider,
              borderWidth: 1.5,
            },
            "&:hover fieldset": {
              borderColor: theme.palette.primary.light,
            },
            "&.Mui-focused fieldset": {
              borderColor: theme.palette.primary.main,
              borderWidth: 2,
            },
          },

          "& .MuiInputLabel-root": {
            color: theme.palette.text.secondary,
            fontWeight: theme.typography.fontWeightMedium,
            "&.Mui-focused": {
              color: theme.palette.primary.main,
            },
          },

          "& .MuiSvgIcon-root": {
            color: theme.palette.action.active,
          },

          "& .MuiPickersDay-root": {
            borderRadius: theme.shape.borderRadius / 2,
            "&:hover": {
              backgroundColor: theme.palette.primary.light,
            },
            "&.Mui-selected": {
              backgroundColor: theme.palette.primary.main,
              "&:hover": {
                backgroundColor: theme.palette.primary.dark,
              },
            },
          },

          "& .MuiOutlinedInput-input": {
            padding: theme.spacing(1.5, 2),
            fontSize: theme.typography.body1.fontSize,
          },
          ...sx,
        }}
        format="DD/MM/YYYY"
        slotProps={{
          textField: {
            fullWidth: true,
          },
          actionBar: {
            actions: ["today", "clear"],
          },
        }}
        {...props}
      />
    </LocalizationProvider>
  );
}

export default CustomCalendar;