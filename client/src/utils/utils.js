export const UTILS = {
  obtenerDiaId: (dia) => {
    const dias = [
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado",
    ];
    return dias.indexOf(dia.toLowerCase());
  },

  obtenerDiaNombre: (id) => {
    const dias = [
      "Lunes",
      "Martes",
      "Miercoles",
      "Jueves",
      "Viernes",
      "Sabado",
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
      if (hora >= inicio_hora && hora < fin_hora) {
        console.log("Añadiendo bloque:", hora);
        bloques.push(hora);
      }
    });

    return bloques;
  },
  horariosAcademicos: [
    "07:00",
    "07:45",
    "08:30",
    "09:15",
    "10:00",
    "10:45",
    "11:30",
    "12:15",
    "13:00",
    "13:45",
    "14:30",
    "15:15",
    "16:00",
    "16:45",
    "17:30",
    "18:15",
    "19:00",
    "19:45",
  ],
  diasSemana: ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"],

  initialHours: {
    700: null,
    745: null,
    830: null,
    915: null,
    1000: null,
    1045: null,
    1130: null,
    1215: null,
    1300: null,
    1345: null,
    1430: null,
    1515: null,
    1600: null,
    1645: null,
    1730: null,
    1815: null,
    1900: null,
    1945: null,
    2030: null,
  },
};
