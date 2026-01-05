// cacheSlice.js
import { createSlice } from '@reduxjs/toolkit';

const cacheSlice = createSlice({
  name: 'cache',
  initialState: {
    profesorHorarios: {}, // { cedula: { data, timestamp } }
    aulaHorarios: {},     // { idAula: { data, timestamp } }
    cacheDuration: 5 * 60 * 1000, // 5 minutos
  },
  reducers: {
    setProfesorHorarioCache: (state, action) => {
      const { cedula, data } = action.payload;
      state.profesorHorarios[cedula] = {
        data,
        timestamp: Date.now(),
      };
    },
    setAulaHorarioCache: (state, action) => {
      const { idAula, data } = action.payload;
      state.aulaHorarios[idAula] = {
        data,
        timestamp: Date.now(),
      };
    },
    clearCache: (state) => {
      state.profesorHorarios = {};
      state.aulaHorarios = {};
    },
  },
});

export const { setProfesorHorarioCache, setAulaHorarioCache, clearCache } = cacheSlice.actions;
export default cacheSlice.reducer;