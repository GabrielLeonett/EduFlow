import { jest } from "@jest/globals";

// Mock de todas las dependencias ANTES de importar UserService
jest.unstable_mockModule("../../src/services/validation.service.js", () => ({
  default: {
    validateLogin: jest.fn(),
    validateContrasenia: jest.fn(),
    validateId: jest.fn(),
    validateActualizacionPerfil: jest.fn()
  }
}));

jest.unstable_mockModule("../../src/models/user.model.js", () => ({
  default: {
    loginUser: jest.fn(),
    obtenerUsuarioPorId: jest.fn(),
    cambiarContraseña: jest.fn(),
    actualizarUsuario: jest.fn()
  }
}));

jest.unstable_mockModule("../../src/utils/encrypted.js", () => ({
  comparePassword: jest.fn(),
  hashPassword: jest.fn()
}));

jest.unstable_mockModule("../../src/utils/auth.js", () => ({
  createSession: jest.fn()
}));

jest.unstable_mockModule("../../src/utils/utilis.js", () => ({
  asegurarStringEnMinusculas: jest.fn()
}));

jest.unstable_mockModule("../../src/utils/FormatterResponseService.js", () => ({
  default: {
    validationError: jest.fn(),
    isError: jest.fn(),
    success: jest.fn(),
    unauthorized: jest.fn(),
    notFound: jest.fn(),
    error: jest.fn()
  }
}));

// Ahora importamos UserService después de configurar los mocks
const UserService = (await import("../../src/services/user.service.js")).default;
const ValidationService = (await import("../../src/services/validation.service.js")).default;
const UserModel = (await import("../../src/models/user.model.js")).default;
const { comparePassword, hashPassword } = await import("../../src/utils/encrypted.js");
const { createSession } = await import("../../src/utils/auth.js");
const { asegurarStringEnMinusculas } = await import("../../src/utils/utilis.js");
const FormatterResponseService = (await import("../../src/utils/FormatterResponseService.js")).default;

describe("🧩 Pruebas del servicio UserService", () => {
  // Deshabilitar console.log y console.error durante las pruebas
  let originalConsoleLog, originalConsoleError;

  beforeAll(() => {
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterAll(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("🔐 login()", () => {
    test("debe retornar error si la validación falla", async () => {
      // Configurar mocks
      ValidationService.validateLogin.mockReturnValue({
        isValid: false,
        errors: [{ path: "email", message: "Email inválido" }],
        data: null
      });

      FormatterResponseService.validationError.mockReturnValue({
        error: true,
        message: "Error de validación en login"
      });

      // Ejecutar
      const result = await UserService.login({ email: "", password: "" });

      // Verificar
      expect(ValidationService.validateLogin).toHaveBeenCalledWith({
        email: "",
        password: ""
      });
      expect(FormatterResponseService.validationError).toHaveBeenCalledWith(
        [{ path: "email", message: "Email inválido" }],
        "Error de validación en login"
      );
      expect(result).toEqual({
        error: true,
        message: "Error de validación en login"
      });
    });

    test("debe retornar error si el usuario no existe", async () => {
      // Configurar mocks
      ValidationService.validateLogin.mockReturnValue({
        isValid: true,
        errors: [],
        data: { email: "test@test.com", password: "1234" }
      });

      asegurarStringEnMinusculas.mockReturnValue("test@test.com");

      const fakeError = { 
        error: true, 
        message: "Usuario no encontrado" 
      };
      UserModel.loginUser.mockResolvedValue(fakeError);
      FormatterResponseService.isError.mockReturnValue(true);

      // Ejecutar
      const result = await UserService.login({
        email: "test@test.com",
        password: "1234"
      });

      // Verificar
      expect(UserModel.loginUser).toHaveBeenCalledWith("test@test.com");
      expect(result).toEqual(fakeError);
    });

    test("debe retornar éxito si el login es correcto", async () => {
      // Configurar mocks
      ValidationService.validateLogin.mockReturnValue({
        isValid: true,
        errors: [],
        data: { email: "usuario@correo.com", password: "1234" }
      });

      asegurarStringEnMinusculas.mockReturnValue("usuario@correo.com");

      const fakeUser = {
        id: 1,
        nombres: "José",
        apellidos: "Leite",
        password: "hashed123",
        roles: ["admin"],
        primera_vez: false
      };

      UserModel.loginUser.mockResolvedValue({ data: fakeUser });
      FormatterResponseService.isError.mockReturnValue(false);
      comparePassword.mockResolvedValue(true);
      createSession.mockReturnValue("fake-jwt-token");

      FormatterResponseService.success.mockReturnValue({
        success: true,
        message: "Inicio de sesión exitoso",
        data: {
          token: "fake-jwt-token",
          user: {
            id: 1,
            nombres: "José",
            apellidos: "Leite",
            roles: ["admin"],
            primera_vez: false
          }
        }
      });

      // Ejecutar
      const result = await UserService.login({
        email: "usuario@correo.com",
        password: "1234"
      });

      // Verificar
      expect(result.success).toBe(true);
      expect(result.data.token).toBe("fake-jwt-token");
      expect(UserModel.loginUser).toHaveBeenCalledWith("usuario@correo.com");
      expect(comparePassword).toHaveBeenCalledWith("1234", "hashed123");
      expect(createSession).toHaveBeenCalledWith({
        object: {
          id: 1,
          apellidos: "Leite",
          nombres: "José",
          roles: ["admin"]
        }
      });
    });

    test("debe lanzar error si la contraseña es inválida", async () => {
      // Configurar mocks
      ValidationService.validateLogin.mockReturnValue({
        isValid: true,
        errors: [],
        data: { email: "usuario@correo.com", password: "mala" }
      });

      asegurarStringEnMinusculas.mockReturnValue("usuario@correo.com");

      const fakeUser = {
        id: 1,
        nombres: "José",
        apellidos: "Leite",
        password: "hashed123"
      };

      UserModel.loginUser.mockResolvedValue({ data: fakeUser });
      FormatterResponseService.isError.mockReturnValue(false);
      comparePassword.mockResolvedValue(false);

      FormatterResponseService.unauthorized.mockImplementation(() => {
        throw new Error("Correo o contraseña inválida");
      });

      // Ejecutar y verificar
      await expect(
        UserService.login({ email: "usuario@correo.com", password: "mala" })
      ).rejects.toThrow("Correo o contraseña inválida");

      expect(comparePassword).toHaveBeenCalledWith("mala", "hashed123");
    });
  });

  describe("🔑 cambiarContraseña()", () => {
    test("debe retornar error si la validación falla", async () => {
      // Configurar mocks
      ValidationService.validateContrasenia.mockReturnValue({
        isValid: false,
        errors: [{ path: "password", message: "Contraseña muy débil" }],
        data: null
      });

      FormatterResponseService.validationError.mockReturnValue({
        error: true,
        message: "Error de validación en cambio de contraseña"
      });

      // Ejecutar
      const result = await UserService.cambiarContraseña(
        { antiguaPassword: "old", password: "weak" },
        { id: 1, nombres: "Test", apellidos: "User" }
      );

      // Verificar
      expect(ValidationService.validateContrasenia).toHaveBeenCalledWith({
        antiguaPassword: "old",
        password: "weak"
      });
      expect(result).toEqual({
        error: true,
        message: "Error de validación en cambio de contraseña"
      });
    });

    test("debe cambiar contraseña exitosamente", async () => {
      // Configurar mocks
      ValidationService.validateContrasenia.mockReturnValue({
        isValid: true,
        errors: [],
        data: { antiguaPassword: "old123", password: "new123" }
      });

      const usuarioBD = { password: "hashedOld123" };
      UserModel.obtenerUsuarioPorId.mockResolvedValue({ data: [usuarioBD] });
      comparePassword.mockResolvedValue(true);
      hashPassword.mockResolvedValue("hashedNew123");
      UserModel.cambiarContraseña.mockResolvedValue({ success: true });
      FormatterResponseService.isError.mockReturnValue(false);

      FormatterResponseService.success.mockReturnValue({
        success: true,
        message: "Contraseña cambiada exitosamente"
      });

      // Ejecutar
      const result = await UserService.cambiarContraseña(
        { antiguaPassword: "old123", password: "new123" },
        { id: 1, nombres: "Test", apellidos: "User" }
      );

      // Verificar
      expect(UserModel.obtenerUsuarioPorId).toHaveBeenCalledWith(1);
      expect(comparePassword).toHaveBeenCalledWith("old123", "hashedOld123");
      expect(hashPassword).toHaveBeenCalledWith("new123");
      expect(UserModel.cambiarContraseña).toHaveBeenCalledWith(1, "hashedNew123");
      expect(result.success).toBe(true);
    });
  });

  describe("👤 obtenerPerfil()", () => {
    test("debe retornar perfil del usuario exitosamente", async () => {
      // Configurar mocks
      ValidationService.validateId.mockReturnValue({
        isValid: true,
        errors: [],
        data: 1
      });

      const fakeUser = {
        id: 1,
        nombres: "Juan",
        apellidos: "Pérez",
        email: "juan@test.com",
        password: "hashed123",
        roles: ["user"]
      };

      UserModel.obtenerUsuarioPorId.mockResolvedValue({ data: fakeUser });
      FormatterResponseService.isError.mockReturnValue(false);

      FormatterResponseService.success.mockReturnValue({
        success: true,
        message: "Perfil obtenido exitosamente",
        data: {
          id: 1,
          nombres: "Juan",
          apellidos: "Pérez",
          email: "juan@test.com",
          roles: ["user"]
        }
      });

      // Ejecutar
      const result = await UserService.obtenerPerfil(1);

      // Verificar
      expect(ValidationService.validateId).toHaveBeenCalledWith(1, "usuario");
      expect(UserModel.obtenerUsuarioPorId).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
      expect(result.data.password).toBeUndefined(); // Password no debe estar en la respuesta
    });

    test("debe retornar error si el usuario no existe", async () => {
      // Configurar mocks
      ValidationService.validateId.mockReturnValue({
        isValid: true,
        errors: [],
        data: 999
      });

      UserModel.obtenerUsuarioPorId.mockResolvedValue({ data: null });
      FormatterResponseService.isError.mockReturnValue(false);

      FormatterResponseService.notFound.mockReturnValue({
        error: true,
        message: "Usuario no encontrado"
      });

      // Ejecutar
      const result = await UserService.obtenerPerfil(999);

      // Verificar
      expect(result.error).toBe(true);
      expect(result.message).toBe("Usuario no encontrado");
    });
  });

  describe("🔄 actualizarPerfil()", () => {
    test("debe actualizar perfil exitosamente", async () => {
      // Configurar mocks
      ValidationService.validateId.mockReturnValue({
        isValid: true,
        errors: [],
        data: 1
      });

      ValidationService.validateActualizacionPerfil.mockReturnValue({
        isValid: true,
        errors: [],
        data: { nombres: "Juan Carlos", apellidos: "Pérez" }
      });

      const datosActualizacion = {
        nombres: "Juan Carlos",
        apellidos: "Pérez"
      };

      UserModel.actualizarUsuario.mockResolvedValue({ 
        data: { ...datosActualizacion, id: 1 } 
      });
      FormatterResponseService.isError.mockReturnValue(false);

      FormatterResponseService.success.mockReturnValue({
        success: true,
        message: "Perfil actualizado exitosamente",
        data: { ...datosActualizacion, id: 1 }
      });

      // Ejecutar
      const result = await UserService.actualizarPerfil(1, datosActualizacion);

      // Verificar
      expect(ValidationService.validateActualizacionPerfil)
        .toHaveBeenCalledWith(datosActualizacion);
      expect(UserModel.actualizarUsuario)
        .toHaveBeenCalledWith(1, datosActualizacion);
      expect(result.success).toBe(true);
    });
  });

  describe("🚪 cerrarSesion()", () => {
    test("debe cerrar sesión exitosamente", async () => {
      // Configurar mocks
      FormatterResponseService.success.mockReturnValue({
        success: true,
        message: "Sesión cerrada exitosamente"
      });

      // Ejecutar
      const result = await UserService.cerrarSesion();

      // Verificar
      expect(result.success).toBe(true);
      expect(result.message).toBe("Sesión cerrada exitosamente");
    });
  });

  describe("✅ verificarSesion()", () => {
    test("debe verificar sesión exitosamente", async () => {
      const fakeUser = {
        id: 1,
        nombres: "Test",
        apellidos: "User",
        roles: ["admin"]
      };

      FormatterResponseService.success.mockReturnValue({
        success: true,
        message: "Sesión verificada exitosamente",
        data: fakeUser
      });

      // Ejecutar
      const result = await UserService.verificarSesion(fakeUser);

      // Verificar
      expect(result.success).toBe(true);
      expect(result.data).toEqual(fakeUser);
    });
  });
});