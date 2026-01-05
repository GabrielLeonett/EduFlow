import { jest } from "@jest/globals";

// ✅ MOCKS CON jest.mock() - Esto es CLAVE
jest.mock("../../src/services/validation.service.js", () => ({
  validateSede: jest.fn(),
  validateId: jest.fn(),
  validatePartialSede: jest.fn(),
}));

jest.mock("../../src/models/sedes.model.js", () => ({
  crearSede: jest.fn(),
  mostrarSedes: jest.fn(),
  obtenerSedePorId: jest.fn(),
  actualizarSede: jest.fn(),
  eliminarSede: jest.fn(),
}));

jest.mock("../../src/utils/FormatterResponseService.js", () => ({
  validationError: jest.fn(),
  isError: jest.fn(),
  success: jest.fn(),
  notFound: jest.fn(),
  error: jest.fn(),
  unauthorized: jest.fn(),
}));

jest.mock("../../src/services/notification.service.js", () => ({
  default: jest.fn().mockImplementation(() => ({
    crearNotificacionMasiva: jest.fn(),
  })),
}));

// ✅ Ahora importamos los mocks
import ValidationService from "../../src/services/validation.service.js";

import SedeModel from "../../src/models/sedes.model.js";

import FormatterResponseService from "../../src/utils/FormatterResponseService.js";

import NotificationService from "../../src/services/notification.service.js";

// ✅ Finalmente importamos el servicio a probar
import SedeService from "../../src/services/sedes.service.js";

describe("🧩 Pruebas del servicio SedeService", () => {
  let mockCrearNotificacionMasiva;

  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.clearAllMocks();

  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("🏢 registrarSede()", () => {
    test("debe retornar error si la validación de sede falla", async () => {
      // Configurar mocks
      validateSede.mockReturnValue({
        isValid: false,
        errors: [{ path: "nombreSede", message: "Nombre requerido" }],
        data: null,
      });

      validationError.mockReturnValue({
        error: true,
        message: "Error de validación en registro de sede",
      });

      // Ejecutar
      const result = await SedeService.registrarSede(
        { nombreSede: "" },
        { id: 1, nombres: "Admin", apellidos: "User" }
      );

      // Verificar
      expect(validateSede).toHaveBeenCalledWith({ nombreSede: "" });
      expect(validationError).toHaveBeenCalledWith(
        [{ path: "nombreSede", message: "Nombre requerido" }],
        "Error de validación en registro de sede"
      );
      expect(result.error).toBe(true);
    });

    test("debe retornar error si la validación de usuario falla", async () => {
      // Configurar mocks
      validateSede.mockReturnValue({
        isValid: true,
        errors: [],
        data: { nombreSede: "Sede Test", UbicacionSede: "Ubicación Test" },
      });

      validateId
        .mockReturnValueOnce({
          // Primera llamada para sede
          isValid: true,
          errors: [],
          data: null,
        })
        .mockReturnValueOnce({
          // Segunda llamada para usuario (falla)
          isValid: false,
          errors: [{ path: "id", message: "ID inválido" }],
          data: null,
        });

      validationError.mockReturnValue({
        error: true,
        message: "ID de usuario inválido",
      });

      // Ejecutar
      const result = await SedeService.registrarSede(
        { nombreSede: "Sede Test", UbicacionSede: "Ubicación Test" },
        { id: "invalid", nombres: "Admin", apellidos: "User" }
      );

      // Verificar
      expect(validateId).toHaveBeenCalledWith("invalid", "usuario");
      expect(result.error).toBe(true);
    });

    test("debe registrar sede exitosamente", async () => {
      // Configurar mocks
      const datosSede = {
        nombreSede: "Sede Central",
        UbicacionSede: "Av. Principal 123",
        GoogleSede: "https://maps.google.com/123",
      };

      validateSede.mockReturnValue({
        isValid: true,
        errors: [],
        data: datosSede,
      });

      validateId.mockReturnValue({
        isValid: true,
        errors: [],
        data: 1,
      });

      const respuestaModel = {
        state: "success",
        data: { id_sede: 1 },
      };

      crearSede.mockResolvedValue(respuestaModel);
      mockCrearNotificacionMasiva.mockResolvedValue({ success: true });
      isError.mockReturnValue(false);

      success.mockReturnValue({
        success: true,
        message: "Sede registrada exitosamente",
        data: {
          message: "Sede creada exitosamente",
          sede: {
            id: 1,
            nombre: "Sede Central",
            direccion: "Av. Principal 123",
            google_maps: "https://maps.google.com/123",
            estado: "activa",
          },
        },
      });

      // Ejecutar
      const result = await SedeService.registrarSede(datosSede, {
        id: 1,
        nombres: "Admin",
        apellidos: "User",
      });

      // Verificar
      expect(crearSede).toHaveBeenCalledWith(datosSede, 1);
      expect(mockCrearNotificacionMasiva).toHaveBeenCalledWith({
        titulo: "Nueva Sede Registrada",
        tipo: "sede_creada",
        contenido:
          'Se ha registrado la sede "Sede Central" en el sistema. Ubicación: Av. Principal 123',
        metadatos: {
          sede_nombre: "Sede Central",
          sede_direccion: "Av. Principal 123",
          google_maps: "https://maps.google.com/123",
          usuario_creador: 1,
          fecha_registro: expect.any(String),
          url_action: "/sedes/1",
        },
      });
      expect(result.success).toBe(true);
    });

    test("debe manejar error del modelo al crear sede", async () => {
      // Configurar mocks
      validateSede.mockReturnValue({
        isValid: true,
        errors: [],
        data: null,
      });

      validateId.mockReturnValue({
        isValid: true,
        errors: [],
        data: 1,
      });

      const errorModel = {
        state: "error",
        status: 500,
        title: "Error de BD",
        message: "No se pudo crear la sede",
      };

      crearSede.mockResolvedValue(errorModel);
      isError.mockReturnValue(true);

      // Ejecutar
      const result = await SedeService.registrarSede(
        { nombreSede: "Sede Test" },
        { id: 1, nombres: "Admin", apellidos: "User" }
      );

      // Verificar
      expect(result).toEqual(errorModel);
    });
  });

  describe("📋 mostrarSedes()", () => {
    test("debe retornar lista de sedes formateadas correctamente", async () => {
      // Configurar mocks
      const datosModel = {
        data: [
          {
            id_sede: 1,
            nombre_sede: "Sede Central",
            ubicacion_sede: "Av. Principal",
            google_sede: "https://maps.com/1",
            created_at: "2023-01-01",
            updated_at: "2023-01-01",
            id_pnf: 1,
            codigo_pnf: "PNF001",
            nombre_pnf: "Ingeniería",
            descripcion_pnf: "Descripción PNF",
            poblacion_estudiantil_pnf: 100,
            activo: true,
          },
        ],
      };

      mostrarSedes.mockResolvedValue(datosModel);
      isError.mockReturnValue(false);

      success.mockReturnValue({
        success: true,
        message: "Sedes obtenidas exitosamente",
        data: {
          sedes: [
            {
              id_sede: 1,
              nombre_sede: "Sede Central",
              ubicacion_sede: "Av. Principal",
              google_sede: "https://maps.com/1",
              created_at: "2023-01-01",
              updated_at: "2023-01-01",
              pnfs: [
                {
                  id_pnf: 1,
                  codigo_pnf: "PNF001",
                  nombre_pnf: "Ingeniería",
                  descripcion_pnf: "Descripción PNF",
                  poblacion_estudiantil_pnf: 100,
                  activo: true,
                },
              ],
            },
          ],
          total: 1,
        },
      });

      // Ejecutar
      const result = await SedeService.mostrarSedes();

      // Verificar
      expect(mostrarSedes).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    test("debe propagar error del modelo", async () => {
      // Configurar mocks
      const errorModel = {
        error: true,
        message: "Error de base de datos",
      };

      mostrarSedes.mockResolvedValue(errorModel);
      isError.mockReturnValue(true);

      // Ejecutar
      const result = await SedeService.mostrarSedes();

      // Verificar
      expect(result).toEqual(errorModel);
    });
  });

  describe("🔍 obtenerSedePorId()", () => {
    test("debe retornar error si el ID es inválido", async () => {
      // Configurar mocks
      validateId.mockReturnValue({
        isValid: false,
        errors: [{ path: "id", message: "ID inválido" }],
        data: null,
      });

      validationError.mockReturnValue({
        error: true,
        message: "ID de sede inválido",
      });

      // Ejecutar
      const result = await SedeService.obtenerSedePorId("invalid");

      // Verificar
      expect(validateId).toHaveBeenCalledWith("invalid", "sede");
      expect(result.error).toBe(true);
    });

    test("debe retornar sede formateada correctamente", async () => {
      // Configurar mocks
      validateId.mockReturnValue({
        isValid: true,
        errors: [],
        data: 1,
      });

      const datosModel = {
        data: [
          {
            id_sede: 1,
            nombre_sede: "Sede Central",
            ubicacion_sede: "Av. Principal",
            google_sede: "https://maps.com/1",
            created_at: "2023-01-01",
            updated_at: "2023-01-01",
            id_pnf: 1,
            codigo_pnf: "PNF001",
            nombre_pnf: "Ingeniería",
            descripcion_pnf: "Descripción PNF",
            poblacion_estudiantil_pnf: 100,
            activo: true,
          },
        ],
      };

      obtenerSedePorId.mockResolvedValue(datosModel);
      isError.mockReturnValue(false);

      success.mockReturnValue({
        success: true,
        message: "Sede obtenida exitosamente",
        data: {
          id_sede: 1,
          nombre_sede: "Sede Central",
          ubicacion_sede: "Av. Principal",
          google_sede: "https://maps.com/1",
          created_at: "2023-01-01",
          updated_at: "2023-01-01",
          pnfs: [
            {
              id_pnf: 1,
              codigo_pnf: "PNF001",
              nombre_pnf: "Ingeniería",
              descripcion_pnf: "Descripción PNF",
              poblacion_estudiantil_pnf: 100,
              activo: true,
            },
          ],
        },
      });

      // Ejecutar
      const result = await SedeService.obtenerSedePorId(1);

      // Verificar
      expect(obtenerSedePorId).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
    });

    test("debe retornar error si la sede no existe", async () => {
      // Configurar mocks
      validateId.mockReturnValue({
        isValid: true,
        errors: [],
        data: 999,
      });

      const datosModel = {
        data: [],
      };

      obtenerSedePorId.mockResolvedValue(datosModel);
      isError.mockReturnValue(false);

      notFound.mockReturnValue({
        error: true,
        message: "Sede no encontrada",
      });

      // Ejecutar
      const result = await SedeService.obtenerSedePorId(999);

      // Verificar
      expect(result.error).toBe(true);
      expect(result.message).toBe("Sede no encontrada");
    });
  });
});
