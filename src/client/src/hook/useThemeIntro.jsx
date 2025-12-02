// hooks/useIntroTheme.js
import { useEffect } from "react";
import { useTheme } from "@mui/material";

export const useIntroTheme = () => {
  const theme = useTheme();

  useEffect(() => {
    // Crear o actualizar estilos personalizados
    const style = document.createElement("style");
    style.textContent = `
      .introjs-overlay {
        background-color: ${theme.palette.background.default}50 !important;
      }
      
      .introjs-tooltip {
        background-color: ${theme.palette.background.paper} !important;
        color: ${theme.palette.text.primary} !important;
        border-radius: ${theme.shape.borderRadius}px !important;
        box-shadow: ${theme.shadows[4]} !important;
        border: 1px solid ${theme.palette.divider} !important;
        min-width: 300px;
        max-width: 400px;
      }
      
      .introjs-tooltip-header {
        background-color: ${theme.palette.primary.main} !important;
        color: ${theme.palette.primary.contrastText} !important;
        padding: 12px 16px;
        border-radius: ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0;
      }
      
      .introjs-arrow {
        border-color: ${theme.palette.background.paper} !important;
      }
      
      .introjs-arrow.top {
        border-bottom-color: ${theme.palette.background.paper} !important;
      }
      
      .introjs-arrow.bottom {
        border-top-color: ${theme.palette.background.paper} !important;
      }
      
      .introjs-arrow.left {
        border-right-color: ${theme.palette.background.paper} !important;
      }
      
      .introjs-arrow.right {
        border-left-color: ${theme.palette.background.paper} !important;
      }
      
      .introjs-button {
        background-color: ${theme.palette.primary.light} !important;
        color: ${theme.palette.primary.contrastText} !important;
        border: none !important;
        border-radius: ${theme.shape.borderRadius}px !important;
        padding: 8px 16px !important;
        text-transform: none !important;
        margin: 0 4px !important;
        transition: all 0.2s ease-in-out !important;
      }
      
      .introjs-button:hover {
        background-color: ${theme.palette.primary.dark} !important;
        transform: translateY(-1px);
        box-shadow: ${theme.shadows[2]} !important;
      }
      
      .introjs-button.introjs-disabled {
        background-color: ${theme.palette.action.disabled} !important;
        color: ${theme.palette.text.disabled} !important;
      }
      
      .introjs-button.introjs-prevbutton {
        background-color: ${theme.palette.grey[300]} !important;
        color: ${theme.palette.text.primary} !important;
      }
      
      .introjs-button.introjs-prevbutton:hover {
        background-color: ${theme.palette.grey[400]} !important;
      }
      
      .introjs-bullets ul li a {
        background: ${theme.palette.grey[300]} !important;
      }
      
      .introjs-bullets ul li a.active {
        background: ${theme.palette.primary.main} !important;
      }
      
      .introjs-skipbutton {
        color: ${theme.palette.text.secondary} !important;
        background: transparent !important;
      }
      
      .introjs-skipbutton:hover {
        color: ${theme.palette.primary.main} !important;
        background: transparent !important;
      }
      
      .introjs-highlight {
        border: 2px solid ${theme.palette.primary.main} !important;
        border-radius: ${theme.shape.borderRadius}px !important;
        box-shadow: 0 0 0 1000px ${theme.palette.background.default}80 !important;
      }
      
      .introjs-progress {
        background-color: ${theme.palette.grey[300]} !important;
        border-radius: 4px;
      }
      
      .introjs-progressbar {
        background-color: ${theme.palette.primary.main} !important;
        border-radius: 4px;
      }
    `;

    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [theme]);
};
