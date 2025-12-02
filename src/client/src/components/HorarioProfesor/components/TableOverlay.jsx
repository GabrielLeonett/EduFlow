import {
  Box,
  Fade,
  IconButton,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  useTheme,
  alpha,
  Stack,
} from "@mui/material";
import {
  Edit as EditIcon,
  Print as PrintIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

const TableOverlay = ({
  isVisible,
  isCustom,
  setCustom,
  onPrint,
  onClose,
  title = "Opciones del Horario",
}) => {
  const theme = useTheme();

  const handlePrintClick = () => {
    if (onPrint) {
      onPrint();
    }
  };

  const handleEditClick = () => {
    if (isCustom && setCustom) {
      setCustom((prev) => !prev);
    }
  };

  const ActionCard = ({
    icon,
    title,
    description,
    onClick,
    disabled = false,
  }) => (
    <Card
      sx={{
        width: { xs: 140, sm: 160, md: 180 },
        height: { xs: 140, sm: 160, md: 180 },
        transition: "all 0.3s ease-in-out",
        border: `2px solid ${
          disabled
            ? alpha(theme.palette.grey[400], 0.2)
            : alpha(theme.palette.primary.main, 0.1)
        }`,
        "&:hover": !disabled && {
          transform: "translateY(-4px)",
          boxShadow: theme.shadows[8],
          border: `2px solid ${theme.palette.primary.main}`,
        },
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <CardActionArea
        onClick={onClick}
        disabled={disabled}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CardContent
          sx={{
            textAlign: "center",
            width: "100%",
          }}
        >
          {/* Icon Container */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignContent: "center",
            }}
          >
            <Box
              sx={{
                mb: 2,
                backgroundColor: disabled
                  ? alpha(theme.palette.grey[400], 0.1)
                  : alpha(theme.palette.primary.main, 0.1),
                width: { xs: 60, sm: 70, md: 80 },
                height: { xs: 60, sm: 70, md: 80 },
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                transition: "all 0.3s ease-in-out",
                "&:hover": !disabled && {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                },
              }}
            >
              {icon}
            </Box>
          </Box>

          {/* Content */}
          <Typography
            variant="h6"
            component="div"
            gutterBottom
            fontWeight="bold"
            sx={{ fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" } }}
          >
            {title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.875rem" } }}
          >
            {description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );

  return (
    <Fade in={isVisible} timeout={500}>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: alpha(theme.palette.background.paper, 0.50),
          backdropFilter: "blur(8px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1300, // Asegurar que esté por encima de otros elementos
        }}
      >
        {/* Header with Close Button */}
        <Box sx={{ position: "absolute", top: 16, right: 16 }}>
          <IconButton
            onClick={onClose}
            sx={{
              backgroundColor: alpha(theme.palette.grey[500], 0.1),
              "&:hover": {
                backgroundColor: alpha(theme.palette.grey[500], 0.2),
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Title */}
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          fontWeight="bold"
          color="primary"
          sx={{
            mb: 4,
            fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
            textAlign: "center",
          }}
        >
          {title}
        </Typography>

        {/* Actions Grid */}
        <Stack
          direction="row"
          spacing={{ xs: 2, sm: 3, md: 4 }}
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <ActionCard
            icon={
              <EditIcon
                sx={{
                  fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                  color: isCustom
                    ? theme.palette.primary.main
                    : theme.palette.grey[500],
                }}
              />
            }
            title="Editar"
            description={
              isCustom ? "Modificar horario existente" : "Edición no disponible"
            }
            onClick={handleEditClick}
            disabled={!isCustom}
          />

          <ActionCard
            icon={
              <PrintIcon
                sx={{
                  fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                  color: theme.palette.secondary.main,
                }}
              />
            }
            title="Imprimir"
            description="Generar PDF del horario"
            onClick={handlePrintClick}
          />
        </Stack>

        {/* Instructions */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 2,
            textAlign: "center",
            maxWidth: 400,
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
            px: 2,
          }}
        >
          {!isCustom
            ? "El modo de edición no está disponible en esta vista. Solo puedes imprimir el horario."
            : "Haz clic en 'Editar' para modificar el horario o 'Imprimir' para generar un PDF."}
        </Typography>
      </Box>
    </Fade>
  );
};

export default TableOverlay;
