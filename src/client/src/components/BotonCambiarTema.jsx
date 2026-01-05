import Button from '@mui/material/Button';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';

export default function BotonCambiarTema({ setMode, mode }) {
  const theme = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  // Efecto para cargar el tema del localStorage al montar
  useEffect(() => {
    const savedTheme = localStorage.getItem('tema');
    if (savedTheme) {
      setMode(savedTheme === 'dark');
    }
    setIsMounted(true);
  }, [setMode]);

  // Efecto para guardar en localStorage cuando cambia el tema
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('tema', mode ? 'dark' : 'light');
    }
  }, [mode, isMounted]);

  const handleThemeToggle = () => {
    const newMode = !mode;
    console.log('Cambiando modo a:', newMode ? 'dark' : 'light');
    setMode(newMode);
  };

  // Evitar renderizado hasta tener el estado del localStorage
  if (!isMounted) {
    return null;
  }

  const tooltipText = mode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

  return (
    <Tooltip title={tooltipText} placement='left-start'>
      <Button
        onClick={handleThemeToggle}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          minWidth: 'auto',
          width: 48,
          height: 48,
          borderRadius: '50%',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[4],
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
            boxShadow: theme.shadows[8],
            transform: 'scale(1.05)',
          },
          transition: theme.transitions.create(['all'], {
            duration: theme.transitions.duration.shorter,
          }),
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label={tooltipText}
      >
        {mode ? (
          <LightModeIcon fontSize="small" />
        ) : (
          <DarkModeIcon fontSize="small" />
        )}
      </Button>
    </Tooltip>
  );
}