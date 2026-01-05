import { Badge, IconButton, useTheme, Tooltip } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";

export default function NotificationTarget({
  NumNotificationNoRead = 0,
  setTarget,
  Target,
  size = "medium",
  color = "inherit",
}) {
  const theme = useTheme();

  const getIconSize = () => {
    switch (size) {
      case "small":
        return "small";
      case "large":
        return "large";
      default:
        return "medium";
    }
  };

  return (
    <Tooltip
      title={Target ? "Cerrar notificaciones" : "Ver notificaciones"}
      arrow
    >
      <IconButton
        onClick={() => setTarget(!Target)}
        color={color}
        size={size}
        sx={{
          position: "relative",
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
            transform: "scale(1.05)",
          },
          transition: theme.transitions.create(
            ["background-color", "transform"],
            {
              duration: theme.transitions.duration.short,
            }
          ),
        }}
      >
        <Badge
          badgeContent={NumNotificationNoRead}
          color="error"
          max={99}
          sx={{
            "& .MuiBadge-badge": {
              fontSize: "0.7rem",
              height: "18px",
              minWidth: "18px",
              backgroundColor: theme.palette.error.main,
              color: theme.palette.primary.contrastText,
              border: `2px solid ${theme.palette.background.paper}`,
              ...(NumNotificationNoRead === 0 && {
                display: "none",
              }),
            },
          }}
        >
          <NotificationsIcon
            sx={{
              color: theme.palette.primary.contrastText,
            }}
            fontSize={getIconSize()}
          />
        </Badge>
      </IconButton>
    </Tooltip>
  );
}
