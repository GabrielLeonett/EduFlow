// hooks/useApi.js
import axios from "axios";
import { useMemo } from "react";
import env from "../config/env";

export const useApi = () => {
  const RESPONSE_TYPES = {
    SUCCESS: "success",
    ERROR: "error",
    VALIDATION_ERROR: "validation_error",
    BINARY: "binary",
  };

  const axiosInstance = useMemo(() => {
    const instance = axios.create({
      baseURL: env.serverUrl,
      timeout: 30000,
      withCredentials: true,
    });

    // --- INTERCEPTOR DE RESPUESTA ---
    instance.interceptors.response.use(
      (response) => {
        const contentType = response.headers["content-type"];
        const isBinaryResponse =
          contentType &&
          (contentType.includes("image/") ||
            contentType.includes("application/octet-stream") ||
            contentType.includes("application/pdf") ||
            response.config.responseType === "blob" ||
            response.config.responseType === "arraybuffer");

        // 🧾 Caso 1: respuesta binaria (imagen/pdf)
        if (isBinaryResponse) {
          return {
            type: RESPONSE_TYPES.BINARY,
            data: response.data,
            headers: response.headers,
            status: response.status,
            config: response.config,
            _isBinary: true,
          };
        }

        const backendResponse = response.data;

        // ✅ Caso 2: respuesta exitosa estándar del backend
        if (backendResponse && backendResponse.success === true) {
          return backendResponse.data ?? backendResponse;
        }

        // ❌ Caso 3: respuesta de error del backend (FormatterResponseController)
        if (backendResponse && backendResponse.success === false) {
          const errorType =
            backendResponse.error?.code === "VALIDATION_ERROR"
              ? RESPONSE_TYPES.VALIDATION_ERROR
              : RESPONSE_TYPES.ERROR;

          return Promise.reject({
            type: errorType,
            status: backendResponse.status,
            title: backendResponse.title,
            message: backendResponse.message,
            data: backendResponse.data,
            error: backendResponse.error,
            originalResponse: response,
            _backendStructure: "FormatterResponseController",
          });
        }

        // ⚠️ Caso 4: respuesta sin formato esperado
        if (response.status >= 200 && response.status < 300) {
          return backendResponse;
        }

        return Promise.reject({
          type: RESPONSE_TYPES.ERROR,
          status: response.status,
          title: `Error HTTP ${response.status}`,
          message: "Error desconocido en la respuesta",
          data: backendResponse,
          _backendStructure: "unknown",
        });
      },

      // --- INTERCEPTOR DE ERROR ---
      (error) => {
        let formattedError = {
          type: RESPONSE_TYPES.ERROR,
          status: error.response?.status || 500,
          title: "Error",
          message: "Error de conexión",
          data: null,
          error: null,
          originalError: error,
          _backendStructure: "network_error",
        };

        // Timeout
        if (error.code === "ECONNABORTED") {
          formattedError.message = "Timeout: la solicitud tardó demasiado";
          formattedError.title = "Timeout";
        }
        // Respuesta con error HTTP
        else if (error.response) {
          const backendError = error.response.data;
          console.error("💥 Error de axios:", backendError);

          if (backendError && backendError.success === false) {
            formattedError.type =
              backendError.error?.code === "VALIDATION_ERROR"
                ? RESPONSE_TYPES.VALIDATION_ERROR
                : RESPONSE_TYPES.ERROR;
            formattedError.status = backendError.status;
            formattedError.title = backendError.title;
            formattedError.message = backendError.message;
            formattedError.error = backendError.error;
            formattedError.data = backendError.data;
            formattedError._backendStructure = "FormatterResponseController";
          } else {
            formattedError.message = `Error HTTP ${error.response.status}`;
            formattedError.title = "Error HTTP";
            formattedError.data = backendError;
            formattedError._backendStructure = "http_error";
          }
        } else if (error.request) {
          formattedError.message = "No se pudo conectar con el servidor";
          formattedError.title = "Error de Conexión";
        }

        return Promise.reject(formattedError);
      }
    );

    // --- MÉTODOS AUXILIARES ---
    instance.responseTypes = RESPONSE_TYPES;

    instance.isSuccess = (res) => res && res.success === true;
    instance.isError = (res) => res && res.success === false;
    instance.isValidationError = (err) =>
      err.type === RESPONSE_TYPES.VALIDATION_ERROR ||
      err.error?.code === "VALIDATION_ERROR";

    instance.isBinary = (res) =>
      res && (res._isBinary === true || res.type === RESPONSE_TYPES.BINARY);

    instance.isImage = (res) => {
      if (!instance.isBinary(res)) return false;
      const contentType = res.headers?.["content-type"];
      return contentType && contentType.includes("image/");
    };

    instance.handleImageResponse = async (response, filename = "image") => {
      if (!instance.isBinary(response))
        throw new Error("No es respuesta binaria");

      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const imageUrl = URL.createObjectURL(blob);

      return {
        blob,
        imageUrl,
        contentType: response.headers["content-type"],
        size: blob.size,
        filename,
        headers: response.headers,
      };
    };

    instance.getImageBlob = async (url, options = {}) => {
      const response = await instance.get(url, {
        responseType: "blob",
        ...options,
      });
      if (instance.isBinary(response)) {
        return instance.handleImageResponse(response);
      }
      throw new Error("La respuesta no es una imagen");
    };

    instance.downloadFile = async (url, filename) => {
      const response = await instance.get(url, { responseType: "blob" });
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      return true;
    };

    return instance;
  }, []);

  return axiosInstance;
};

export default useApi;
