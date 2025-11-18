// src/hooks/useTour.js
import introJs from "intro.js";
import "intro.js/introjs.css";
import { useCallback } from "react";
import { useIntroTheme } from "./useThemeIntro";

/**
 * Hook reutilizable para mostrar tours interactivos con Intro.js
 * @param {Array} steps - Lista de pasos [{ element, intro, position }]
 * @param {string} storageKey - Clave de almacenamiento local (única por módulo)
 * @param {Object} options - Opciones adicionales de Intro.js
 */
export function useTour(steps, storageKey = "tourUPTAMCA", options = {}) {
  useIntroTheme();
  const startTour = useCallback(() => {
    try {
      // Verifica si el usuario ya vio el tour
      const yaVisto = localStorage.getItem(storageKey);

      const defaultOptions = {
        nextLabel: "Siguiente",
        prevLabel: "Anterior",
        doneLabel: "Finalizar",
        tooltipPosition: "auto",
        tooltipClass: "custom-intro-tooltip",
        highlightClass: "custom-intro-highlight",
        exitOnOverlayClick: false,
        showBullets: true,
        showProgress: true,
        keyboardNavigation: true,
        overlayOpacity: 0.5,
        positionPrecedence: ["bottom", "top", "right", "left"],
      };

      if (!yaVisto) {
        const intro = introJs();

        intro.setOptions({
          steps,
          ...defaultOptions,
          ...options, // permite sobreescribir configuraciones
        });

        // Guarda el estado cuando termina o sale
        intro.oncomplete(() => localStorage.setItem(storageKey, "true"));
        intro.onexit(() => localStorage.setItem(storageKey, "true"));

        intro.start();
      }
    } catch (error) {
      console.error("Error iniciando tour:", error);
    }
  }, [options, steps, storageKey]);

  const resetTour = useCallback(() => {
    // Permite reactivar el tour manualmente
    localStorage.removeItem(storageKey);
    startTour();
  }, [startTour, storageKey]);

  return { startTour, resetTour };
}
