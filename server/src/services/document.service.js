import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  ImageRun,
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
  PageOrientation,
  TextWrappingType,
  WidthType,
  AlignmentType,
  TextRun,
  Header,
} from "docx";
import sharp from "sharp";
import { UTILS } from "../utils/utilis.js";
import { loadEnv } from "../utils/utilis.js";
import path from "path";

// Estilos globales
const ESTILOS = {
  fuente: "Calibri",
  tamanos: {
    titulo: 36,
    subtitulo: 28,
    encabezado: 14,
    contenido: 12,
    hora: 10,
    detalle: 11,
    informacion: 16,
  },
  espaciado: {
    paddingCelda: 80,
    marginInterno: 40,
    alturaFila: 600,
    entreLineas: 250,
    alturaFilaInformacion: 800,
  },
  colores: {
    primario: "2E75B5",
    secundario: "D9E2F3",
    fondoClase: "F8F9FA",
    textoClaro: "FFFFFF",
    textoOscuro: "000000",
    textoGris: "666666",
    borde: "CCCCCC",
    fondoInformacion: "E7EFF9",
  },
  bordes: {
    grosor: 2,
    color: "CCCCCC",
  },
};

/**
 * Servicio para la generación de documentos Word con horarios académicos
 * @class DocumentServices
 * @author Gabriel Leonett
 */
class DocumentServices {
  /**
   * Obtiene el logo para usar como marca de agua en el documento
   * @static
   * @async
   * @returns {Promise<ImageRun|null>} Imagen del logo procesada o null si hay error
   * @author Gabriel Leonett
   */
  static async traerLogoMarcaAgua() {
    try {
      const logoPath = path.resolve(process.cwd(), "src/utils/LogoSimple.png");

      console.log("🔍 Buscando logo en:", logoPath);

      if (!fs.existsSync(logoPath)) {
        console.error("❌ Archivo de logo no encontrado:", logoPath);
        return null;
      }

      const logoData = fs.readFileSync(logoPath);
      console.log(
        "✅ Logo leído correctamente, tamaño:",
        logoData.length,
        "bytes"
      );

      const imagenProcesada = await sharp(logoData)
        .ensureAlpha()
        .png({ transparency: true, compressionLevel: 9 })
        .toBuffer();

      console.log("✅ Logo procesado para marca de agua");

      const logoMarcaAgua = new ImageRun({
        data: imagenProcesada,
        transformation: {
          width: 400,
          height: 400,
        },
        floating: {
          horizontalPosition: {
            relative: HorizontalPositionRelativeFrom.PAGE,
            align: AlignmentType.CENTER,
          },
          verticalPosition: {
            relative: VerticalPositionRelativeFrom.PAGE,
            align: AlignmentType.CENTER,
          },
          wrap: {
            type: TextWrappingType.BEHIND,
          },
          zIndex: -9999,
        },
      });

      console.log("✅ Logo de marca de agua creado exitosamente");
      return logoMarcaAgua;
    } catch (error) {
      console.error("❌ Error procesando logo para marca de agua:", error);
      return null;
    }
  }

  /**
   * Crea un texto estilizado para usar en el documento
   * @static
   * @param {string} texto - Texto a estilizar
   * @param {Object} config - Configuración de estilo
   * @param {boolean} [config.bold=false] - Si el texto debe ser negrita
   * @param {number} [config.size=ESTILOS.tamanos.contenido] - Tamaño de fuente
   * @param {string} [config.color=ESTILOS.colores.textoOscuro] - Color del texto
   * @returns {TextRun} Texto estilizado
   * @author Gabriel Leonett
   */
  static crearTextoEstilizado(texto, config = {}) {
    const {
      bold = false,
      size = ESTILOS.tamanos.contenido,
      color = ESTILOS.colores.textoOscuro,
    } = config;

    return new TextRun({
      text: texto,
      bold: bold,
      size: size * 2,
      color: color,
      font: ESTILOS.fuente,
    });
  }

  /**
   * Crea un párrafo estilizado para el documento
   * @static
   * @param {Array|TextRun} children - Elementos hijos del párrafo
   * @param {Object} config - Configuración del párrafo
   * @param {AlignmentType} [config.alignment=AlignmentType.CENTER] - Alineación del texto
   * @param {Object} [config.spacing] - Espaciado del párrafo
   * @returns {Paragraph} Párrafo estilizado
   * @author Gabriel Leonett
   */
  static crearParrafoEstilizado(children, config = {}) {
    const {
      alignment = AlignmentType.CENTER,
      spacing = {
        line: ESTILOS.espaciado.entreLineas,
        before: ESTILOS.espaciado.marginInterno,
        after: ESTILOS.espaciado.marginInterno,
      },
    } = config;

    return new Paragraph({
      children: Array.isArray(children) ? children : [children],
      alignment: alignment,
      spacing: spacing,
    });
  }

  /**
   * Crea una celda de tabla estilizada
   * @static
   * @param {Array} children - Elementos hijos de la celda
   * @param {Object} config - Configuración de la celda
   * @param {Object} [config.shading=null] - Color de fondo de la celda
   * @param {number} [config.rowSpan=1] - Número de filas que ocupa la celda
   * @param {number} [config.colSpan=1] - Número de columnas que ocupa la celda
   * @param {Object} [config.borders] - Configuración de bordes
   * @param {Object} [config.margins] - Márgenes internos de la celda
   * @param {string} [config.verticalAlign="center"] - Alineación vertical del contenido
   * @returns {TableCell} Celda estilizada
   * @author Gabriel Leonett
   */
  static crearCeldaEstilizada(children, config = {}) {
    const {
      shading = null,
      rowSpan = 1,
      colSpan = 1,
      borders = {
        top: {
          style: "single",
          size: ESTILOS.bordes.grosor,
          color: ESTILOS.bordes.color,
        },
        bottom: {
          style: "single",
          size: ESTILOS.bordes.grosor,
          color: ESTILOS.bordes.color,
        },
        left: {
          style: "single",
          size: ESTILOS.bordes.grosor,
          color: ESTILOS.bordes.color,
        },
        right: {
          style: "single",
          size: ESTILOS.bordes.grosor,
          color: ESTILOS.bordes.color,
        },
      },
      margins = {
        top: ESTILOS.espaciado.paddingCelda,
        bottom: ESTILOS.espaciado.paddingCelda,
        left: ESTILOS.espaciado.paddingCelda,
        right: ESTILOS.espaciado.paddingCelda,
      },
      verticalAlign = "center",
    } = config;

    return new TableCell({
      children: Array.isArray(children) ? children : [children],
      shading: shading,
      rowSpan: rowSpan,
      columnSpan: colSpan,
      borders: borders,
      margins: margins,
      verticalAlign: verticalAlign,
    });
  }

  /**
   * Función principal que genera el documento de horario y devuelve el buffer
   * @static
   * @async
   * @param {Object} configuracion - Configuración del horario
   * @param {boolean} [toPDF=true] - Indica si se debe convertir a PDF
   * @returns {Promise<Buffer>} Buffer del documento generado (Word o PDF)
   * @throws {Error} Si hay error en la generación del documento
   * @author Gabriel Leonett
   */
  static async generarDocumentoHorario(configuracion = {}) {
    try {
      console.log("🔄 Generando documento de horario...");

      const doc = await this.crearDocumentoHorario(configuracion);
      const wordBuffer = await Packer.toBuffer(doc);

      console.log("✅ Documento Word generado exitosamente");

      return {
        buffer: wordBuffer,
        metodo: "word",
        extension: "docx",
      };
    } catch (error) {
      console.error("❌ Error al generar el documento:", error);
      throw error;
    }
  }

  /**
   * Procesa el horario y genera la matriz para la tabla
   * @static
   * @param {Array} horario - Array con el horario de clases
   * @param {Object} turno - Objeto de turno
   * @param {string} turno.hora_inicio - Hora inicio del turno
   * @param {string} turno.hora_fin - Hora fin del turno
   * @returns {Object} Objeto con matrizHorario y horasDisponibles
   * @author Gabriel Leonett
   */
  static procesarHorario(
    horario = [],
    turno = { hora_inicio: "07:00", hora_fin: "20:00" }
  ) {
    const diasSemana = [
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado",
    ];
    const horasDisponibles = this.generarHorasDisponibles(turno);

    const matrizHorario = diasSemana.map((dia) => ({
      dia,
      horas: horasDisponibles.reduce((acc, hora) => {
        acc[hora] = null;
        return acc;
      }, {}),
    }));

    // Llenar con las clases del horario
    if (horario && horario.length > 0) {
      horario.forEach((dia) => {
        if (!dia.nombre) return;

        const diaIndex = diasSemana.indexOf(dia.nombre.toLowerCase());
        if (diaIndex === -1) return;

        dia.clases?.forEach((clase) => {
          const [hIni, mIni] = clase.hora_inicio.split(":");
          const [hFin, mFin] = clase.hora_fin.split(":");
          const inicio = UTILS.horasMinutos(parseInt(hIni), parseInt(mIni));
          const fin = UTILS.horasMinutos(parseInt(hFin), parseInt(mFin));
          const bloques = Math.ceil((fin - inicio) / 45);

          for (let i = 0; i < bloques; i++) {
            const minutosActual = inicio + i * 45;
            const h = Math.floor(minutosActual / 60);
            const m = minutosActual % 60;
            const horaHHMM = h * 100 + m;

            if (matrizHorario[diaIndex].horas[horaHHMM] !== undefined) {
              if (i === 0) {
                matrizHorario[diaIndex].horas[horaHHMM] = {
                  ocupado: true,
                  datos_clase: { ...clase, horas_clase: bloques },
                  bloque: i,
                  bloques_totales: bloques,
                };
              } else {
                matrizHorario[diaIndex].horas[horaHHMM] = {
                  ocupado: true,
                  es_continuacion: true,
                };
              }
            }
          }
        });
      });
    }

    return {
      matrizHorario,
      horasDisponibles: horasDisponibles.sort((a, b) => a - b),
    };
  }

  /**
   * Crea la fila de información con datos del PNF, Trayecto y Sección
   * @static
   * @param {number} numColumnas - Número de columnas/días que tiene la tabla
   * @param {Object} pnf - Datos del PNF
   * @param {Object} trayecto - Datos del trayecto
   * @param {Object} seccion - Datos de la sección
   * @returns {TableRow} Fila de información
   * @author Gabriel Leonett
   */
  static crearFilaInformacion(numColumnas, pnf, trayecto, seccion) {
    const textoInformacion = `PNF EN ${pnf.nombre_pnf.toUpperCase()} TRAYECTO ${
      trayecto.valor_trayecto
    } SECCIÓN ${seccion.valor_seccion}`;

    return new TableRow({
      children: [
        this.crearCeldaEstilizada(
          [
            this.crearParrafoEstilizado(
              this.crearTextoEstilizado(textoInformacion, {
                bold: true,
                size: ESTILOS.tamanos.informacion,
                color: ESTILOS.colores.textoClaro,
              })
            ),
          ],
          {
            shading: { fill: ESTILOS.colores.primario },
            colSpan: numColumnas,
          }
        ),
      ],
      height: {
        value: ESTILOS.espaciado.alturaFilaInformacion,
        rule: "atLeast",
      },
    });
  }

  /**
   * Crea todas las filas de la tabla del horario
   * @static
   * @param {Array} matrizHorario - Matriz con los datos del horario
   * @param {Array} horasDisponibles - Array con las horas disponibles
   * @param {Object} pnf - Datos del PNF
   * @param {Object} trayecto - Datos del trayecto
   * @param {Object} seccion - Datos de la sección
   * @returns {Array<TableRow>} Array de filas de la tabla
   * @author Gabriel Leonett
   */
  static crearFilasTabla(
    matrizHorario,
    horasDisponibles,
    pnf,
    trayecto,
    seccion
  ) {
    const filas = [];

    // Fila de información
    const totalColumnas = 1 + matrizHorario.length;
    const filaInfo = this.crearFilaInformacion(
      totalColumnas,
      pnf,
      trayecto,
      seccion
    );
    filas.push(filaInfo);

    // Fila de encabezado con días
    const filaEncabezado = new TableRow({
      children: [
        this.crearCeldaEstilizada(
          this.crearParrafoEstilizado(
            this.crearTextoEstilizado("Hora/Día", {
              bold: true,
              size: ESTILOS.tamanos.encabezado,
              color: ESTILOS.colores.textoClaro,
            })
          ),
          {
            shading: { fill: ESTILOS.colores.primario },
          }
        ),
        ...matrizHorario.map((dia) =>
          this.crearCeldaEstilizada(
            this.crearParrafoEstilizado(
              this.crearTextoEstilizado(
                dia.dia.charAt(0).toUpperCase() + dia.dia.slice(1),
                {
                  bold: true,
                  size: ESTILOS.tamanos.encabezado,
                  color: ESTILOS.colores.textoClaro,
                }
              )
            ),
            {
              shading: { fill: ESTILOS.colores.primario },
            }
          )
        ),
      ],
    });
    filas.push(filaEncabezado);

    // Array para trackear rowSpans activos por día
    const rowSpansActivos = matrizHorario.map(() => ({
      activo: false,
      filasRestantes: 0,
    }));

    // Filas con horarios y clases
    horasDisponibles.forEach((hora, index) => {
    const horas = `${UTILS.formatearHora(hora)} - ${UTILS.horariosAcademicos[index+1]}`
      const celdas = [
        this.crearCeldaEstilizada(
          this.crearParrafoEstilizado(
            this.crearTextoEstilizado(horas, {
              bold: true,
              size: ESTILOS.tamanos.hora,
            })
          ),
          {
            shading: { fill: ESTILOS.colores.secundario },
          }
        ),
      ];

      // Procesar cada día
      matrizHorario.forEach((dia, diaIndex) => {
        const celdaInfo = dia.horas[hora];
        const rowSpanInfo = rowSpansActivos[diaIndex];

        // 1. Si hay un rowSpan activo para este día
        if (rowSpanInfo.activo) {
          rowSpanInfo.filasRestantes--;

          if (rowSpanInfo.filasRestantes === 0) {
            rowSpanInfo.activo = false;
          }
          return; // Salir sin agregar celda
        }

        // 2. Si es una continuación de otra clase
        if (celdaInfo?.es_continuacion) {
          return; // Salir sin agregar celda
        }
        
        // 3. Si es el inicio de una nueva clase con múltiples bloques
        if (celdaInfo?.ocupado && celdaInfo.bloque === 0) {
          const clase = celdaInfo.datos_clase;
          console.log(clase.nombres_profesor || clase.apellido_profesor)  
          const contenido = [
            this.crearParrafoEstilizado(
              this.crearTextoEstilizado(
                clase.nombre_unidad_curricular || clase.materia || "Clase",
                { bold: true, size: ESTILOS.tamanos.contenido }
              )
            ),
            ...(clase.nombres_profesor || clase.apellido_profesor
              ? [
                  this.crearParrafoEstilizado(
                    this.crearTextoEstilizado(
                      `Prof: ${clase.nombre_profesor?.split(" ")[0]} ${clase.apellido_profesor?.split(" ")[0]}`,
                      { size: ESTILOS.tamanos.detalle }
                    )
                  ),
                ]
              : []),
            ...(clase.codigo_aula
              ? [
                  this.crearParrafoEstilizado(
                    this.crearTextoEstilizado(`Aula: ${clase.codigo_aula}`, {
                      size: ESTILOS.tamanos.detalle,
                    })
                  ),
                ]
              : []),
            this.crearParrafoEstilizado(
              this.crearTextoEstilizado(
                `${clase.hora_inicio} - ${clase.hora_fin}`,
                {
                  size: ESTILOS.tamanos.detalle,
                  color: ESTILOS.colores.textoGris,
                }
              )
            ),
          ];

          celdas.push(
            this.crearCeldaEstilizada(contenido, {
              rowSpan: celdaInfo.bloques_totales,
              shading: { fill: ESTILOS.colores.fondoClase },
            })
          );

          // Activar el tracking de rowSpan
          rowSpansActivos[diaIndex] = {
            activo: true,
            filasRestantes: celdaInfo.bloques_totales - 1,
          };
        } else {
          // 4. Celda vacía normal
          celdas.push(
            this.crearCeldaEstilizada([this.crearParrafoEstilizado("")])
          );
        }
      });

      filas.push(
        new TableRow({
          children: celdas,
          height: {
            value: ESTILOS.espaciado.alturaFila,
            rule: "atLeast",
          },
        })
      );
    });

    return filas;
  }

  /**
   * Función principal para crear el documento de horario en formato Word
   * @static
   * @async
   * @param {Object} configuracion - Configuración del horario académico
   * @param {Object} configuracion.pnf - Información del PNF
   * @param {Object} configuracion.trayecto - Información del trayecto
   * @param {Object} configuracion.seccion - Información de la sección
   * @param {Array} configuracion.horario - Array con el horario de clases
   * @param {Object} configuracion.turno - Información del turno (hora inicio/fin)
   * @returns {Promise<Document>} Documento Word configurado
   * @author Gabriel Leonett
   */
  static async crearDocumentoHorario(configuracion = {}) {
    const {
      pnf = "",
      trayecto = "",
      seccion = "",
      horario = [],
      turno = { hora_inicio: "07:00", hora_fin: "20:00" },
    } = configuracion;

    // Validar datos esenciales
    if (!pnf || !trayecto || !seccion) {
      throw new Error("Faltan datos esenciales (pnf, trayecto o seccion)");
    }

    // Procesar el horario
    const { matrizHorario, horasDisponibles } = this.procesarHorario(
      horario,
      turno
    );

    // Obtener la marca de agua
    const logoMarcaAgua = await this.traerLogoMarcaAgua();

    const header = new Header({
      children: [
        new Paragraph({
          children: logoMarcaAgua ? [logoMarcaAgua] : [],
        }),
      ],
    });

    // Crear filas de la tabla
    const filas = this.crearFilasTabla(
      matrizHorario,
      horasDisponibles,
      pnf,
      trayecto,
      seccion
    );

    // Crear el documento Word
    const doc = new Document({
      creator: "Vicerrectorado academico UPTAMCA",
      styles: {
        default: {
          document: {
            run: {
              font: ESTILOS.fuente,
              size: ESTILOS.tamanos.contenido * 2,
            },
            paragraph: {
              spacing: { line: ESTILOS.espaciado.entreLineas },
            },
          },
        },
        paragraphStyles: [
          {
            id: "Normal",
            name: "Normal",
            basedOn: "Normal",
            next: "Normal",
            run: {
              font: ESTILOS.fuente,
              size: ESTILOS.tamanos.contenido * 2,
            },
            paragraph: {
              spacing: { line: ESTILOS.espaciado.entreLineas },
            },
          },
        ],
      },
      sections: [
        {
          properties: {
            page: {
              size: {
                orientation: PageOrientation.LANDSCAPE,
              },
              margin: {
                top: 400,
                right: 400,
                bottom: 400,
                left: 400,
              },
            },
          },
          headers: {
            default: header,
          },
          children: [
            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              columnWidths: [1200, ...Array(matrizHorario.length).fill(2200)],
              rows: filas,
            }),
          ],
        },
      ],
    });

    return doc;
  }

  /**
   * Genera un array con las horas disponibles basado en el turno
   * @static
   * @param {Object} turno - Objeto con hora de inicio y fin
   * @param {string} turno.hora_inicio - Hora de inicio del turno (formato HH:MM)
   * @param {string} turno.hora_fin - Hora de fin del turno (formato HH:MM)
   * @returns {Array<number>} Array de horas en formato HHMM (ej: 700, 745, 830)
   * @author Gabriel Leonett
   */
  static generarHorasDisponibles(turno) {
    const [hora_inicio, minInicio] = turno.hora_inicio.split(":");
    const [hora_fin, minFin] = turno.hora_fin.split(":");

    const MinutosInicio = UTILS.horasMinutos(
      parseInt(hora_inicio),
      parseInt(minInicio)
    );
    const MinutosFin = UTILS.horasMinutos(parseInt(hora_fin), parseInt(minFin));

    const horaInicioHHMM = UTILS.calcularHorasHHMM(MinutosInicio);
    const horaFinHHMM = UTILS.calcularHorasHHMM(MinutosFin);

    const horas = [];
    let horaActual = horaInicioHHMM;

    while (horaActual <= horaFinHHMM) {
      horas.push(horaActual);
      const horasActual = Math.floor(horaActual / 100);
      const minutosActual = horaActual % 100;
      const minutosTotales = horasActual * 60 + minutosActual + 45;
      horaActual = UTILS.calcularHorasHHMM(minutosTotales);
    }
    return horas;
  }
}

export default DocumentServices;
