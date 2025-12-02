import { useCallback, useEffect } from "react";

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
          // Calcular horas asignadas vs horas requeridas
          const horasAsignadas = calcularHorasAsignadas(
            tableHorario,
            hora_actual.datos_clase.id_unidad_curricular
          );
          const horasRequeridas = existeUnidad.horas_clase;

          if (horasAsignadas < horasRequeridas) {
            unidadesExistentes.push({
              ...existeUnidad,
              faltan_horas_clase: horasRequeridas - horasAsignadas,
              horas_asignadas: horasAsignadas,
              esVista: true,
            });
          } else {
            unidadesExistentes.push({
              ...existeUnidad,
              horas_asignadas: horasAsignadas,
              esVista: true,
            });
          }

          idsUnidadesExistentes.add(
            hora_actual.datos_clase.id_unidad_curricular
          );
        }
      }
    });
  });

  // Actualizar todas las unidades con la propiedad esVista
  return unidades.map((unidad) => {
    const unidadExistente = unidadesExistentes.find(
      (u) => u.id_unidad_curricular === unidad.id_unidad_curricular
    );

    if (unidadExistente) {
      return {
        ...unidad,
        ...unidadExistente, // Incluye faltan_horas_clase y horas_asignadas si existen
        esVista: true,
      };
    }

    return {
      ...unidad,
      esVista: false,
    };
  });
};

// Función auxiliar para calcular horas asignadas de una unidad curricular
const calcularHorasAsignadas = (tableHorario, idUnidadCurricular) => {
  let totalHoras = 0;

  tableHorario.forEach((dia) => {
    Object.values(dia.horas).forEach((hora_actual) => {
      if (
        hora_actual?.datos_clase?.id_unidad_curricular === idUnidadCurricular
      ) {
        // Sumar la duración de esta clase (en horas académicas de 45 min)
        const duracion = hora_actual.datos_clase.duracion_horas || 1;
        totalHoras += duracion;
      }
    });
  });

  return totalHoras;
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
const useHorarioData = (axios, props, state, stateSetters, Custom, alert) => {
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

  const { trayecto, seccion } = props;

  // Fetch de unidades curriculares CON useCallback
  const fetchUnidadesCurriculares = useCallback(
    async (tableHorarioParam = null) => {
      if (!Custom) {
        console.warn("Custom no está disponible");
        return;
      }

      if (!trayecto?.id_trayecto) {
        console.warn("trayecto no está definido o no tiene id_trayecto");
        return;
      }

      try {
        const res = await axios.get(
          `/trayectos/${trayecto.id_trayecto}/unidades-curriculares`
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
      trayecto?.id_trayecto,
      axios,
      setUnidadesCurriculares,
      tableHorario,
    ]
  );

  // Fetch de profesores CON useCallback
  const fetchProfesores = useCallback(
    async (unidadCurricular, search = null) => {
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

      if (!seccion?.id_seccion) {
        console.warn("Sección no está definida o no tiene id_seccion");
        return;
      }

      try {
        const profesores = await axios.post(
          `/profesores/to/seccion/${seccion.id_seccion}`,
          {
            horas_necesarias: unidadCurricular.horas_clase,
            id_unidad_curricular: unidadCurricular.id_unidad_curricular,
            ...(search && { search: search }),
          }
        );

        if (profesores && Array.isArray(profesores) && profesores.length > 0) {
          setProfesores(profesores);
        } else {
          const confirm = await alert.confirm(
            "¿Seguir Buscando?",
            "No se encontraron profesores con las areas de conocimiento de la unidad curricular, ¿Desea seguir buscando?"
          );

          if (confirm) {
            const profesores = await axios.post(
              `/profesores/to/seccion/${seccion.id_seccion}`,
              {
                horas_necesarias: unidadCurricular.horas_clase,
                ...(search && { search: search }),
              }
            );

            if (
              profesores &&
              Array.isArray(profesores) &&
              profesores.length > 0
            ) {
              setProfesores(profesores);
            } else {
              alert.warning(
                "No se encontraron profesores disponibles para asignar este horario"
              );
              setProfesores([]);
            }
          } else {
            setProfesores([]);
          }
        }
      } catch (error) {
        console.error("Error cargando profesores:", error);
        setProfesores([]);
      }
    },
    [
      Custom,
      unidadesCurriculares,
      seccion?.id_seccion,
      axios,
      setProfesores,
      tableHorario,
      alert,
    ]
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

      if (!seccion?.id_seccion) {
        console.warn("Sección no está definida o no tiene id_seccion");
        return;
      }

      if (!profesor || (!profesor.id_profesor && !profesor.idProfesor)) {
        console.warn("No hay profesor seleccionado o no tiene ID válido");
        return;
      }

      try {
        const id_profesor = profesor.id_profesor || profesor.idProfesor;

        const aulas = await axios.post(
          `/aulas/to/seccion/${seccion.id_seccion}`,
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
      seccion,
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

      try {
        setLoading(true);

        const horario = await axios.get(`/horarios/profesor/${id_profesor}`);

        if (horario) {
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
    [Custom, axios, setProfesorHorario, setLoading]
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

      try {
        setLoading(true);

        const horario = await axios.get(`/horarios/aula/${idAula}`);

        if (horario) {
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
    [Custom, axios, setAulaHorario, setLoading]
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
      // Llamar sin usar cache
      await fetchProfesoresHorario(profesor);
    },
    [fetchProfesoresHorario]
  );
  // Efecto para cargar unidades curriculares automáticamente al inicio
  useEffect(() => {
    if (Custom && trayecto?.id_trayecto && tableHorario) {
      fetchUnidadesCurriculares();
    }
  }, [Custom, trayecto?.id_trayecto, tableHorario, fetchUnidadesCurriculares]);

  const forceRefreshAulaHorario = useCallback(
    async (aula) => {
      // Llamar sin usar cache
      await fetchAulaHorario(aula);
    },
    [fetchAulaHorario]
  );

  const fetchCambiosTableHorario = useCallback(
    async (alert) => {
      try {
        let hayConflictos = false;

        // 1. PRIMERO: Eliminar horarios (si hay)
        if (horariosEliminados.length > 0) {
          for (const id_horario of horariosEliminados) {
            try {
              const respuesta = await axios.delete(`/horarios/${id_horario}`);
              if (respuesta.data && respuesta.success) {
                // ✅ ACTUALIZAR INMEDIATAMENTE: Remover del tableHorario
                setTableHorario(prev => prev.map(dia => {
                  const nuevasHoras = { ...dia.horas };
                  Object.keys(nuevasHoras).forEach(clave => {
                    const celda = nuevasHoras[clave];
                    if (celda?.datos_clase?.id_horario === id_horario) {
                      nuevasHoras[clave] = null; // Eliminar celda
                    }
                  });
                  return { ...dia, horas: nuevasHoras };
                }));

                alert.success(respuesta.title, respuesta.message);
              } else {
                alert.error(respuesta.title, respuesta.message);
              }
            } catch (error) {
              alert.error("Error", "No se pudo eliminar el horario");
            }
          }
          setHorariosEliminados([]);
        }

        // 2. LUEGO: Procesar cambios en tableHorario
        const nuevoTableHorario = [...tableHorario]; // Copia para ir actualizando

        for (const dia of nuevoTableHorario) {
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
                    // ✅ ACTUALIZAR INMEDIATAMENTE: Actualizar datos en tableHorario
                    celda.datos_clase = {
                      ...celda.datos_clase,
                      ...respuesta.horario, // Datos actualizados del servidor
                      clase_move: false, // Quitar flag
                      conflictos: undefined // Limpiar conflictos si existían
                    };

                    alert.success(
                      "Actualización exitosa",
                      `Se actualizó satisfactoriamente el horario`
                    );
                  } else if (respuesta.data?.conflictos) {
                    // ❌ Manejar conflictos - mantener en tableHorario con flag de conflicto
                    celda.datos_clase.conflictos = respuesta.data.conflictos;
                    hayConflictos = true;
                    alert.warning(
                      "Conflictos detectados",
                      `Se encontraron ${respuesta.data.conflictos.length} conflictos al mover la clase`
                    );
                  } else {
                    alert.error(respuesta.title, respuesta.message);
                  }

                } else if (datos_clase.nueva_clase) {
                  // ✅ CREAR nueva clase
                  console.log("Creando nueva clase:", datos_clase);
                  const datosNewHorario = {
                    id_seccion: seccion.id_seccion,
                    id_profesor: datos_clase.id_profesor,
                    id_unidad_curricular: datos_clase.id_unidad_curricular,
                    id_aula: datos_clase.id_aula,
                    dia_semana: datos_clase.dia_semana,
                    hora_inicio: datos_clase.hora_inicio,
                    horas_clase: datos_clase.horas_clase,
                  };

                  const respuesta = await axios.post("/horarios", datosNewHorario);

                  if (respuesta && respuesta.horario) {
                    // ✅ ACTUALIZAR INMEDIATAMENTE: Reemplazar datos temporales con datos reales del servidor
                    celda.datos_clase = {
                      ...celda.datos_clase,
                      ...respuesta.horario, // Datos reales con ID del servidor
                      id_horario: respuesta.horario.id_horario || respuesta.horario.id,
                      nueva_clase: false, // Quitar flag
                      conflictos: undefined // Limpiar conflictos
                    };

                    alert.success(respuesta.title, respuesta.message);
                  } else {
                    alert.error(respuesta.title, respuesta.message);
                  }
                }
              } catch (error) {
                console.log("Error en operación de clase:", error);
                const errorData = error.response?.data || error.data;

                // ❌ Manejar errores con conflictos
                if (error?.status === 409 && errorData.data?.conflictos) {
                  celda.datos_clase.conflictos = errorData.data.conflictos;
                  hayConflictos = true;
                  alert.warning(
                    "Conflictos detectados",
                    `No se pudo mover la clase debido a ${errorData.data.conflictos.length} conflictos`
                  );
                } else if (errorData.conflictos) {
                  celda.datos_clase.conflictos = errorData.conflictos;
                  hayConflictos = true;
                } else {
                  alert.error("Error", "Error al procesar la clase");
                }
              }
            }
          }
        }

        // 3. ACTUALIZAR EL ESTADO GLOBAL
        setTableHorario(nuevoTableHorario);

        // 4. Limpiar flags globales si no hay conflictos
        if (!hayConflictos) {
          setHayCambios(false);
          alert.success(
            "Cambios guardados exitosamente",
            "Todos los cambios se aplicaron correctamente"
          );
        } else {
          alert.warning(
            "Proceso completado con conflictos",
            "Revisa los conflictos en las clases marcadas"
          );
        }

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
      seccion,
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
