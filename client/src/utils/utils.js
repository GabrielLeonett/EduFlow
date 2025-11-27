export const UTILS = {
  obtenerDiaId: (dia) => {
    const dias = [
      "lunes",
      "martes",
      "miércoles",
      "jueves",
      "viernes",
      "sábado",
    ];
    return dias.indexOf(dia.toLowerCase());
  },

  /**
   * Convierte una duración en formato HH:MM:SS a minutos totales y segundos totales
   * @param {string} duracionString - Duración en formato "HH:MM:SS" o "MM:SS" o "HH:MM"
   * @returns {Object} Objeto con minutosTotales y segundosTotales
   */
  convertirDuracion: (duracionString) => {
    if (typeof duracionString !== "string") {
      throw new Error('El parámetro debe ser un string en formato "HH:MM:SS"');
    }

    const partes = duracionString.split(":");

    let horas = 0;
    let minutos = 0;
    let segundos = 0;

    // Manejar diferentes formatos: HH:MM:SS, MM:SS, HH:MM
    if (partes.length === 3) {
      // Formato HH:MM:SS
      [horas, minutos, segundos] = partes.map(Number);
    } else if (partes.length === 2) {
      // Formato MM:SS o HH:MM (asumimos MM:SS si el primer número es < 60)
      const primerValor = parseInt(partes[0]);
      if (primerValor < 60) {
        // Formato MM:SS
        [minutos, segundos] = partes.map(Number);
      } else {
        // Formato HH:MM
        [horas, minutos] = partes.map(Number);
      }
    } else {
      throw new Error('Formato inválido. Use "HH:MM:SS", "MM:SS" o "HH:MM"');
    }

    // Validar valores
    if ([horas, minutos, segundos].some(isNaN)) {
      throw new Error("Todos los valores deben ser números válidos");
    }

    // Calcular totales
    const minutosTotales = horas * 60 + minutos;
    const segundosTotales = horas * 3600 + minutos * 60 + segundos;

    return {
      minutosTotales,
      segundosTotales,
    };
  },

  obtenerDiaNombre: (id) => {
    const dias = [
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    return dias[id] || "";
  },

  sumar45Minutos: (horaMilitar, multiplicar) => {
    const tiempo = parseInt(horaMilitar, 10);
    const horas = Math.floor(tiempo / 100);
    const minutos = tiempo % 100;
    const totalMinutos = horas * 60 + minutos;
    const nuevoTotalMinutos = totalMinutos + 45 * multiplicar;
    let nuevasHoras = Math.floor(nuevoTotalMinutos / 60);
    const nuevosMinutos = nuevoTotalMinutos % 60;

    if (nuevasHoras >= 24) nuevasHoras -= 24;

    const resultado = nuevasHoras * 100 + nuevosMinutos;
    return resultado.toString().padStart(4, "0");
  },

  sumar45MinutosHHMM: (horaMilitar, multiplicar) => {
    const tiempo = parseInt(horaMilitar, 10);
    const horas = Math.floor(tiempo / 100);
    const minutos = tiempo % 100;
    const totalMinutos = horas * 60 + minutos;
    const nuevoTotalMinutos = totalMinutos + 45 * multiplicar;

    let nuevasHoras = Math.floor(nuevoTotalMinutos / 60);
    const nuevosMinutos = nuevoTotalMinutos % 60;

    // Manejar overflow de horas (más de 24 horas)
    if (nuevasHoras >= 24) {
      nuevasHoras = nuevasHoras % 24;
    }

    // Formatear correctamente a HH:MM
    const horasFormateadas = nuevasHoras.toString().padStart(2, "0");
    const minutosFormateados = nuevosMinutos.toString().padStart(2, "0");

    const resultado = `${horasFormateadas}:${minutosFormateados}:00`;

    console.log("Resultado formateado:", resultado);
    return resultado;
  },

  formatearHora: (horaMilitar) => {
    const horas = Math.floor(horaMilitar / 100);
    const minutos = horaMilitar % 100;
    const periodo = horas >= 12 ? "PM" : "AM";
    const horas12 = horas > 12 ? horas - 12 : horas === 0 ? 12 : horas;

    return `${horas12}:${String(minutos).padStart(2, "0")} ${periodo}`;
  },
  formatearHoraMilitar: (horaMilitar) => {
    const horas = Math.floor(horaMilitar / 100);
    const minutos = horaMilitar % 100;
    const horas12 = horas > 12 ? horas - 12 : horas === 0 ? 12 : horas;
    const ceroAñadido = horas > 9 ? "" : "0";

    return `${ceroAñadido}${horas12}:${String(minutos).padStart(2, "0")}:00`;
  },
  formatearHora24: (horaMilitar) => {
    const horas = Math.floor(horaMilitar / 100);
    const minutos = horaMilitar % 100;
    const horasStr = horas.toString().padStart(2, "0");
    const minutosStr = minutos.toString().padStart(2, "0");
    return `${horasStr}:${minutosStr}:00`;
  },
  obtenerTrayectoNumero(trayecto) {
    const trayectos = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6 };
    return trayectos[trayecto] || 1;
  },
  horasMinutos(h, m) {
    return parseInt(h) * 60 + parseInt(m);
  },

  calcularHorasHHMM(minutos) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return h * 100 + m;
  },

  // Función para expandir un rango de horas en bloques individuales de 45 minutos
  RangoHorasSeguidasDisponibilidad(inicio_hora, fin_hora) {
    const bloques = [];

    Object.keys(UTILS.initialHours).forEach((hora) => {
      // Verificar que la hora esté dentro del rango Y no sea "ignorar"
      if (
        hora >= inicio_hora &&
        hora < fin_hora &&
        UTILS.initialHours[hora] !== "ignorar"
      ) {
        bloques.push(hora);
      }
    });

    return bloques;
  },
  horariosAcademicos: [
    "07:00",
    "07:45",
    "08:30",
    "08:45",
    "09:30",
    "10:15",
    "10:20",
    "11:05",
    "11:50",
    "13:00",
    "13:45",
    "14:00",
    "14:10",
    "14:55",
    "15:40",
    "15:50",
    "16:35",
    "17:20",
    "17:30",
    "18:15",
    "19:00",
    "19:45",
  ],
  diasSemana: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],

  initialHours: {
    700: null,
    745: null,
    830: "ignorar",
    845: null,
    930: null,
    1015: "ignorar",
    1020: null,
    1105: null,
    1150: null,
    1300: null,
    1345: null,
    1400: "ignorar",
    1410: null,
    1455: null,
    1540: "ignorar",
    1550: null,
    1635: null,
    1720: "ignorar",
    1730: null,
    1815: null,
    1900: null,
    1945: null,
  },
};
