import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setProfesorHorarioCache,
  setAulaHorarioCache,
} from "../../../cache/cacheSlice";

// Función auxiliar para verificar unidades curriculares existentes (fuera del hook)
const verificarSiExisteUnidadCurricular = (unidades, tableHorario) => {
  if (!unidades || unidades.length === 0) return unidades;

  const idsUnidadesExistentes = new Set();
  const unidadesExistentes = [];

  // Recorrer el horario para encontrar unidades existentes
  tableHorario.forEach((dia) => {
    Object.values(dia.horas).forEach((hora_actual) => {
      if (hora_actual?.datos_clase?.id_unidad_curricular) {
        const existeUnidad = unidades.find(
          (unidad) =>
            unidad.id_unidad_curricular ===
            hora_actual.datos_clase.id_unidad_curricular
        );

        if (
          existeUnidad &&
          !idsUnidadesExistentes.has(
            hora_actual.datos_clase.id_unidad_curricular
          )
        ) {
          unidadesExistentes.push({
            ...existeUnidad,
            esVista: true,
          });
          idsUnidadesExistentes.add(
            hora_actual.datos_clase.id_unidad_curricular
          );
        }
      }
    });
  });

  // Actualizar todas las unidades con la propiedad esVista
  return unidades.map((unidad) => {
    const existe = unidadesExistentes.some(
      (u) => u.id_unidad_curricular === unidad.id_unidad_curricular
    );
    return {
      ...unidad,
      esVista: existe,
    };
  });
};

// Función para validar si las unidades curriculares están inicializadas
const validarUnidadesCurricularesInicializadas = (unidades) => {
  return (
    unidades &&
    Array.isArray(unidades) &&
    unidades.length > 0 &&
    unidades.every(
      (unidad) =>
        unidad &&
        typeof unidad === "object" &&
        unidad.id_unidad_curricular !== undefined &&
        unidad.horas_clase !== undefined
    )
  );
};

// Hook principal de datos
const useHorarioData = (axios, props, state, stateSetters, Custom) => {
  const dispatch = useDispatch();

  // Selector para acceder al cache
  const cache = useSelector((state) => state.cache);

  const {
    setUnidadesCurriculares,
    setAulas,
    setProfesores,
    setProfesorHorario,
    setLoading,
    setAulaHorario,
    setHorariosEliminados,
    setTableHorario,
    setHayCambios,
  } = stateSetters;

  const {
    unidadCurricularSelected,
    unidadesCurriculares,
    tableHorario,
    horariosEliminados,
  } = state;

  const { Trayecto, Seccion } = props;

  // Función auxiliar para verificar cache válido
  const isCacheValid = useCallback(
    (timestamp) => {
      return Date.now() - timestamp < cache.cacheDuration;
    },
    [cache.cacheDuration]
  );

  // Fetch de unidades curriculares CON useCallback
  const fetchUnidadesCurriculares = useCallback(
    async (tableHorarioParam = null) => {
      if (!Custom) {
        console.warn("Custom no está disponible");
        return;
      }

      if (!Trayecto?.id_trayecto) {
        console.warn("Trayecto no está definido o no tiene id_trayecto");
        return;
      }

      try {
        const res = await axios.get(
          `/trayectos/${Trayecto.id_trayecto}/unidades-curriculares`
        );

        if (
          !res ||
          !res.unidades_curriculares ||
          !Array.isArray(res.unidades_curriculares)
        ) {
          console.error("Respuesta inválida de unidades curriculares:", res);
          return;
        }

        // Usar el tableHorario del parámetro o del estado
        const horarioParaVerificar = tableHorarioParam || tableHorario;

        const unidadesActualizadas = verificarSiExisteUnidadCurricular(
          res.unidades_curriculares,
          horarioParaVerificar
        );

        if (validarUnidadesCurricularesInicializadas(unidadesActualizadas)) {
          setUnidadesCurriculares(unidadesActualizadas);
        } else {
          console.error(
            "Unidades curriculares no tienen la estructura esperada"
          );
          setUnidadesCurriculares([]);
        }
      } catch (error) {
        console.error("Error cargando unidades curriculares:", error);
        setUnidadesCurriculares([]);
      }
    },
    [
      Custom,
      Trayecto?.id_trayecto,
      axios,
      setUnidadesCurriculares,
      tableHorario,
    ]
  );

  // Fetch de profesores CON useCallback
  const fetchProfesores = useCallback(
    async (unidadCurricular) => {
      if (!Custom) {
        console.warn("Custom no está disponible");
        return;
      }

      if (!validarUnidadesCurricularesInicializadas(unidadesCurriculares)) {
        console.warn(
          "Unidades curriculares no están inicializadas o no son válidas"
        );
        return;
      }

      if (!unidadCurricular || !unidadCurricular.horas_clase) {
        console.warn(
          "No hay unidad curricular seleccionada o no tiene horas_clase definidas"
        );
        return;
      }

      if (!Seccion?.idSeccion) {
        console.warn("Sección no está definida o no tiene idSeccion");
        return;
      }

      try {
        const profesores = await axios.post(
          `/profesores/to/seccion/${Seccion.idSeccion}`,
          {
            horas_necesarias: unidadCurricular.horas_clase,
          }
        );
        if (profesores && Array.isArray(profesores)) {
          setProfesores(profesores);
        } else {
          console.error("Respuesta de profesores inválida:", profesores);
          setProfesores([]);
        }
      } catch (error) {
        console.error("Error cargando profesores:", error);
        setProfesores([]);
      }
    },
    [Custom, unidadesCurriculares, Seccion?.idSeccion, axios, setProfesores]
  );

  // Fetch de aulas CON useCallback
  const fetchAulas = useCallback(
    async (profesor) => {
      if (!Custom) {
        console.warn("Custom no está disponible");
        return;
      }

      if (!validarUnidadesCurricularesInicializadas(unidadesCurriculares)) {
        console.warn(
          "Unidades curriculares no están inicializadas o no son válidas"
        );
        return;
      }

      if (!unidadCurricularSelected || !unidadCurricularSelected.horas_clase) {
        console.warn(
          "No hay unidad curricular seleccionada o no tiene horas_clase definidas"
        );
        return;
      }

      if (!Seccion?.idSeccion) {
        console.warn("Sección no está definida o no tiene idSeccion");
        return;
      }

      if (!profesor || (!profesor.id_profesor && !profesor.idProfesor)) {
        console.warn("No hay profesor seleccionado o no tiene ID válido");
        return;
      }

      try {
        const id_profesor = profesor.id_profesor || profesor.idProfesor;

        const aulas = await axios.post(
          `/aulas/to/seccion/${Seccion.idSeccion}`,
          {
            id_profesor,
            horas_necesarias: unidadCurricularSelected.horas_clase,
          }
        );

        if (aulas && Array.isArray(aulas)) {
          setAulas(aulas);
        } else {
          console.error("Respuesta de aulas inválida:", aulas);
          setAulas([]);
        }
      } catch (error) {
        console.error("Error cargando aulas:", error);
        setAulas([]);
      }
    },
    [
      Custom,
      unidadesCurriculares,
      unidadCurricularSelected,
      Seccion,
      axios,
      setAulas,
    ]
  );

  // Fetch del horario del profesor CON CACHE
  const fetchProfesoresHorario = useCallback(
    async (profesor) => {
      if (!Custom) {
        console.warn("Custom no está disponible");
        return;
      }

      if (!profesor) {
        console.warn("No se proporcionó un profesor para obtener el horario");
        return;
      }

      // Obtener la cédula del profesor
      const id_profesor = profesor.id_profesor || profesor.id_profesor;

      if (!id_profesor) {
        console.warn("El profesor no tiene id definido");
        return;
      }

      // Verificar si existe en cache y es válido
      const cachedHorario = cache.profesorHorarios[id_profesor];
      if (cachedHorario && isCacheValid(cachedHorario.timestamp)) {
        console.log("✅ Usando horario de profesor desde cache");
        setProfesorHorario(cachedHorario.data);
        return;
      }

      try {
        setLoading(true);

        const horario = await axios.get(`/horarios/profesor/${id_profesor}`);

        if (horario) {
          // Guardar en cache
          dispatch(
            setProfesorHorarioCache({
              id_profesor: id_profesor,
              data: horario,
            })
          );

          setProfesorHorario(horario);
        } else {
          console.error("Respuesta de horario del profesor inválida:", horario);
          setProfesorHorario(null);
        }
      } catch (error) {
        console.error("Error cargando horario del profesor:", error);
        setProfesorHorario(null);
      } finally {
        setLoading(false);
      }
    },
    [
      Custom,
      axios,
      setProfesorHorario,
      setLoading,
      cache.profesorHorarios,
      isCacheValid,
      dispatch,
    ]
  );

  // Fetch del horario del aula CON CACHE
  const fetchAulaHorario = useCallback(
    async (aula) => {
      if (!Custom) {
        console.warn("Custom no está disponible");
        return;
      }

      if (!aula) {
        console.warn("No se proporcionó un aula para obtener el horario");
        return;
      }

      // Obtener el ID del aula
      const idAula = aula.id_aula || aula.idAula;

      if (!idAula) {
        console.warn("El aula no tiene ID definido");
        return;
      }

      // Verificar si existe en cache y es válido
      const cachedHorario = cache.aulaHorarios[idAula];
      if (cachedHorario && isCacheValid(cachedHorario.timestamp)) {
        console.log("✅ Usando horario de aula desde cache");
        setAulaHorario(cachedHorario.data);
        return;
      }

      try {
        setLoading(true);

        const horario = await axios.get(`/horarios/aula/${idAula}`);

        if (horario) {
          // Guardar en cache
          dispatch(
            setAulaHorarioCache({
              idAula: idAula,
              data: horario,
            })
          );

          setAulaHorario(horario);
        } else {
          console.error("Respuesta de horario del aula inválida:", horario);
          setAulaHorario(null);
        }
      } catch (error) {
        console.error("Error cargando horario del aula:", error);
        setAulaHorario(null);
      } finally {
        setLoading(false);
      }
    },
    [
      Custom,
      axios,
      setAulaHorario,
      setLoading,
      cache.aulaHorarios,
      isCacheValid,
      dispatch,
    ]
  );

  // Fetch del info del profesor CON CACHE
  const fetchProfesorCompleto = useCallback(
    async (profesor) => {
      if (!Custom) {
        console.warn("Custom no está disponible");
        return;
      }

      if (!profesor) {
        console.warn("No se proporcionó un profesor para obtener los datos");
        return;
      }

      // Obtener el ID del profesor
      const id_profesor = profesor.id_profesor || profesor.id;

      if (!id_profesor) {
        console.warn("El profesor no tiene id definido");
        return;
      }

      try {
        setLoading(true);

        // Llamar al endpoint específico para movimiento
        const response = await axios.post(
          `/profesor/cambiar/horario/${id_profesor}`
        );

        return response;
      } catch (error) {
        console.error("Error cargando datos completos del profesor:", error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [Custom, axios, setLoading]
  );

  // Fetch del info del aula CON CACHE
  const fetchAulaCompleta = useCallback(
    async (aula) => {
      if (!Custom) {
        console.warn("Custom no está disponible");
        return;
      }

      if (!aula) {
        console.warn("No se proporcionó un aula para obtener los datos");
        return;
      }

      // Obtener el ID del aula
      const id_aula = aula.id_aula || aula.id;

      if (!id_aula) {
        console.warn("El aula no tiene id definido");
        return;
      }

      try {
        setLoading(true);
        // Llamar al endpoint específico para movimiento
        const response = await axios.post(`/aula/cambiar/horario/${id_aula}`);

        return response;
      } catch (error) {
        console.error("Error cargando datos completos del aula:", error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [Custom, axios, setLoading]
  );

  // Función para forzar actualización (ignorar cache)
  const forceRefreshProfesorHorario = useCallback(
    async (profesor) => {
      const cedulaProfesor = profesor.cedula || profesor.cedula_profesor;

      // Limpiar cache específico
      if (cedulaProfesor && cache.profesorHorarios[cedulaProfesor]) {
        // Podrías dispatch una acción para limpiar solo este cache si lo necesitas
      }

      // Llamar sin usar cache
      await fetchProfesoresHorario(profesor);
    },
    [fetchProfesoresHorario, cache.profesorHorarios]
  );
  // Efecto para cargar unidades curriculares automáticamente al inicio
  useEffect(() => {
    if (Custom && Trayecto?.id_trayecto && tableHorario) {
      fetchUnidadesCurriculares();
    }
  }, [Custom, Trayecto?.id_trayecto, tableHorario, fetchUnidadesCurriculares]);

  const forceRefreshAulaHorario = useCallback(
    async (aula) => {
      const idAula = aula.id_aula || aula.idAula;

      // Limpiar cache específico
      if (idAula && cache.aulaHorarios[idAula]) {
        // Podrías dispatch una acción para limpiar solo este cache si lo necesitas
      }

      // Llamar sin usar cache
      await fetchAulaHorario(aula);
    },
    [fetchAulaHorario, cache.aulaHorarios]
  );

  const fetchCambiosTableHorario = useCallback(
    async (alert) => {
      try {
        const resultados = [];
        let hayConflictos = false;

        // 1. PRIMERO: Eliminar horarios (si hay)
        if (horariosEliminados.length > 0) {
          for (const id_horario of horariosEliminados) {
            try {
              const respuesta = await axios.delete(`/horarios/${id_horario}`);
              if (respuesta.data && respuesta.data.success) {
                resultados.push({
                  tipo: "eliminacion",
                  success: true,
                  data: respuesta.data,
                });
                alert.success(respuesta.data.title, respuesta.data.message);
              } else {
                resultados.push({
                  tipo: "eliminacion",
                  success: false,
                  error: respuesta.data,
                });
                alert.error(respuesta.data.title, respuesta.data.message);
              }
            } catch (error) {
              resultados.push({
                tipo: "eliminacion",
                success: false,
                error: error.response?.data || error,
              });
              alert.error("Error", "No se pudo eliminar el horario");
            }
          }
          setHorariosEliminados([]);
        }

        // 2. LUEGO: Procesar cambios en tableHorario
        for (const dia of tableHorario) {
          const horasObjeto = dia.horas;

          for (const clave of Object.keys(horasObjeto)) {
            const celda = horasObjeto[clave];

            if (celda != null && celda.bloque === 0 && celda.datos_clase) {
              const datos_clase = celda.datos_clase;

              // Validar que tenga los datos mínimos necesarios
              if (!datos_clase?.id_profesor || !datos_clase?.id_aula) {
                console.warn("Datos de clase incompletos:", datos_clase);
                continue;
              }

              try {
                if (datos_clase.clase_move) {
                  // ✅ ACTUALIZAR clase existente
                  console.log("Actualizando clase:", datos_clase);
                  const respuesta = await axios.put(
                    `/horarios/${datos_clase.id_horario || datos_clase.id}`,
                    datos_clase
                  );

                  if (respuesta.horario) {
                    resultados.push({
                      tipo: "actualizacion",
                      success: true,
                    });
                    alert.success(
                      "Actualizacion exitosa",
                      `Se actualizo satisfactoriamente el horario${datos_clase.id}`
                    );
                  } else {
                    // Manejar conflictos - CORREGIDO AQUÍ
                    if (
                      respuesta.data &&
                      respuesta.data.data &&
                      respuesta.data.data.conflictos
                    ) {
                      console.log(
                        "🔄 Conflictos detectados:",
                        respuesta.data.data.conflictos
                      );
                      datos_clase.conflictos = respuesta.data.data.conflictos;
                      hayConflictos = true;
                      resultados.push({
                        tipo: "actualizacion",
                        success: false,
                        conflictos: respuesta.data.data.conflictos,
                      });

                      // Mostrar alerta específica de conflictos
                      alert.warning(
                        "Conflictos detectados",
                        `Se encontraron ${respuesta.data.data.conflictos.length} conflictos al mover la clase`
                      );
                    } else {
                      resultados.push({
                        tipo: "actualizacion",
                        success: false,
                        error: respuesta.data,
                      });
                      alert.error(respuesta.data.title, respuesta.data.message);
                    }
                  }
                } else if (datos_clase.nueva_clase) {
                  // ✅ CREAR nueva clase
                  console.log("Creando nueva clase:", datos_clase);
                  const datosNewHorario = {
                    id_seccion: Seccion.idSeccion,
                    id_profesor: datos_clase.id_profesor,
                    id_unidad_curricular: datos_clase.id_unidad_curricular,
                    id_aula: datos_clase.id_aula,
                    dia_semana: datos_clase.dia_semana,
                    hora_inicio: datos_clase.hora_inicio,
                  };

                  const respuesta = await axios.post(
                    "/horarios",
                    datosNewHorario
                  );

                  console.log(respuesta);

                  if (respuesta.data && respuesta.data.success) {
                    // Limpiar flags y actualizar con ID del servidor
                    datos_clase.nueva_clase = false;
                    datos_clase.clase_move = false;

                    if (respuesta.data.data && respuesta.data.data.id) {
                      datos_clase.id = respuesta.data.data.id;
                      datos_clase.id_horario = respuesta.data.data.id;
                    }

                    resultados.push({
                      tipo: "creacion",
                      success: true,
                      data: respuesta.data,
                    });
                    alert.success(respuesta.data.title, respuesta.data.message);
                  } else {
                    resultados.push({
                      tipo: "creacion",
                      success: false,
                      error: respuesta.data,
                    });
                    alert.error(respuesta.data.title, respuesta.data.message);
                  }
                }
              } catch (error) {
                console.log("Error en operación de clase:", error);
                const errorData = error.response?.data || error.data;
                console.log("💥 Error capturado:", errorData);

                // CORRECCIÓN PARA ERRORES 409 CON CONFLICTOS
                if (error?.status === 409 && errorData.data?.conflictos) {
                  console.log(
                    "🔄 Conflictos en error 409:",
                    errorData.data.conflictos
                  );
                  datos_clase.conflictos = errorData.data.conflictos;
                  hayConflictos = true;
                  resultados.push({
                    tipo: datos_clase.clase_move ? "actualizacion" : "creacion",
                    success: false,
                    conflictos: errorData.data.conflictos,
                  });

                  alert.warning(
                    "Conflictos detectados",
                    `No se pudo mover la clase debido a ${errorData.data.conflictos.length} conflictos`
                  );
                } else {
                  resultados.push({
                    tipo: datos_clase.clase_move ? "actualizacion" : "creacion",
                    success: false,
                    error: errorData,
                  });

                  if (errorData.conflictos) {
                    datos_clase.conflictos = errorData.conflictos;
                    hayConflictos = true;
                  } else {
                    alert.error("Error", "Error al procesar la clase");
                  }
                }
              }
            }
          }
        }

        // 3. Actualizar el estado local con los cambios
        if (!hayConflictos) {
          // Solo limpiar flags si no hay conflictos
          const nuevoTableHorario = tableHorario.map((dia) => {
            const nuevasHoras = { ...dia.horas };
            Object.keys(nuevasHoras).forEach((clave) => {
              if (nuevasHoras[clave]?.datos_clase) {
                // Limpiar flags pero mantener otros datos
                nuevasHoras[clave].datos_clase.clase_move = false;
                nuevasHoras[clave].datos_clase.nueva_clase = false;
                delete nuevasHoras[clave].datos_clase.conflictos;
              }
            });
            return { ...dia, horas: nuevasHoras };
          });

          setTableHorario(nuevoTableHorario);
        }

        // 4. Resumen final
        if (hayConflictos) {
          alert.warning(
            "Proceso completado con conflictos",
            "Revisa los conflictos en las clases marcadas"
          );
        } else if (resultados.some((r) => r.success)) {
          alert.success(
            "Cambios guardados exitosamente",
            "Todos los cambios se aplicaron correctamente"
          );
          setHayCambios(false);
        }

        return resultados;
      } catch (error) {
        console.error("Error general en fetchCambiosTableHorario:", error);
        alert.error("Error crítico", "Ocurrió un error inesperado");
        throw error;
      }
    },
    [
      setHayCambios,
      tableHorario,
      horariosEliminados,
      setHorariosEliminados,
      setTableHorario,
      axios,
      Seccion,
    ]
  );

  return {
    // Funciones individuales
    fetchUnidadesCurriculares,
    fetchAulas,
    fetchProfesores,
    fetchProfesoresHorario,
    fetchAulaHorario,
    fetchCambiosTableHorario,
    fetchProfesorCompleto,
    fetchAulaCompleta,
    // Funciones para forzar actualización
    forceRefreshProfesorHorario,
    forceRefreshAulaHorario,
  };
};

export default useHorarioData;
