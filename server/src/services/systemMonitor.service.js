import os from "os";
import SocketServices from "./socket.service.js";

export default class SystemMonitor {
  static async obtenerRendimientoSistema() {
    const cpus = os.cpus();

    // 🔥 MEMORIA DEL SISTEMA COMPLETO
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // 🔥 MEMORIA USADA SOLO POR NODE.JS
    const nodeMemory = process.memoryUsage();

    const memoryUsage = {
      // Sistema completo
      system: {
        total: this.bytesToGB(totalMem),
        used: this.bytesToGB(usedMem),
        free: this.bytesToGB(freeMem),
        usagePercent: ((usedMem / totalMem) * 100).toFixed(2),
      },
      // Solo Node.js
      nodejs: {
        rss: this.bytesToMB(nodeMemory.rss),           // Memoria total asignada al proceso
        heapTotal: this.bytesToMB(nodeMemory.heapTotal), // Tamaño total del heap
        heapUsed: this.bytesToMB(nodeMemory.heapUsed),   // Heap realmente usado
        external: this.bytesToMB(nodeMemory.external),   // Memoria de objetos externos (C++ bindings)
        arrayBuffers: this.bytesToMB(nodeMemory.arrayBuffers || 0), // ArrayBuffers y SharedArrayBuffers
        usagePercent: ((nodeMemory.rss / totalMem) * 100).toFixed(2) // % de RAM total usada por Node.js
      }
    };

    // 🔥 USO DE CPU
    const cpuUsage = await this.getCpuUsage();
    const loadAverage = os.loadavg();

    const performanceData = {
      memory: memoryUsage,
      cpu: cpuUsage,
      loadAverage: {
        "1min": loadAverage[0],
        "5min": loadAverage[1],
        "15min": loadAverage[2],
      },
      uptime: {
        system: os.uptime(),
        nodejs: process.uptime()
      },
      timestamp: new Date().toISOString(),
      activeConnections: this.getActiveConnectionsCount(),
      // 🔥 INFORMACIÓN ESPECÍFICA DE NODE.JS
      nodejs: {
        version: process.version,
        pid: process.pid,
        platform: process.platform,
        arch: process.arch,
        title: process.title,
        memory: {
          total: this.bytesToMB(process.memoryUsage().rss),
          usagePercent: ((process.memoryUsage().rss / totalMem) * 100).toFixed(2)
        }
      }
    };

    // 🔥 ENVIAR DATOS EN TIEMPO REAL
    const socketService = SocketServices.getInstance();
    const io = socketService.initializeService();
    io.to("role_superadmin").emit("system-performance", performanceData);

    return performanceData;
  }

  static bytesToGB(bytes) {
    return (bytes / 1024 / 1024 / 1024).toFixed(2);
  }

  static bytesToMB(bytes) {
    return (bytes / 1024 / 1024).toFixed(2);
  }

  static getActiveConnectionsCount() {
    const socketService = SocketServices.getInstance();
    if (socketService.io) {
      return socketService.io.engine.clientsCount;
    }
    return 0;
  }

  static getCpuUsage() {
    return new Promise((resolve) => {
      const cpus = os.cpus();
      let totalIdle = 0,
        totalTick = 0;

      cpus.forEach((cpu) => {
        for (let type in cpu.times) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      });

      const idle = totalIdle / cpus.length;
      const total = totalTick / cpus.length;
      const usage = 100 - (idle / total) * 100;

      // 🔥 USO DE CPU POR NODE.JS (aproximado)
      const nodeCpuUsage = process.cpuUsage();
      const nodeCpuPercent = (nodeCpuUsage.user + nodeCpuUsage.system) / 1000000; // Convertir a segundos

      resolve({
        // CPU del sistema completo
        systemUsage: usage.toFixed(2),
        // CPU usado por Node.js (aproximación)
        nodejsUsage: (nodeCpuPercent / process.uptime() * 100).toFixed(2),
        cores: cpus.length,
        model: cpus[0]?.model || "Unknown",
      });
    });
  }

  // 🔥 MÉTODO ADICIONAL: Iniciar monitoreo en tiempo real
  static iniciarMonitoreoTiempoReal(intervalo = 5000) {
    console.log("🚀 Iniciando monitoreo en tiempo real...");

    return setInterval(async () => {
      try {
        await this.obtenerRendimientoSistema();
      } catch (error) {
        console.error("Error en monitoreo:", error);
      }
    }, intervalo);
  }
}