"""
SISTEMA UPTAMCA - Script de inicio v2.0.0 con GUI Tkinter
Universidad Politécnica Territorial de los Altos Mirandinos Cecilio Acosta
"""

import os
import sys
import subprocess
import time
import webbrowser
from pathlib import Path
import platform
import requests
import signal
import threading
from datetime import datetime
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import json
import shutil

class SistemaUPTAMCAGUI:
    def __init__(self):
        try:
            # ============ 1. DETERMINAR RUTAS CORRECTAS ============
            if getattr(sys, 'frozen', False):
                self.app_dir = Path(os.path.dirname(sys.executable))
            else:
                self.app_dir = Path(os.path.dirname(os.path.abspath(__file__)))
            
            print(f"Directorio de la aplicación: {self.app_dir}")
            
            # ============ 2. VENTANA PRINCIPAL ============
            self.root = tk.Tk()
            self.root.protocol("WM_DELETE_WINDOW", self._on_closing)
            
            # Configurar color de fondo
            self.root.configure(bg='#1C75BA')
            
            # Título y tamaño
            self.root.title("Sistema UPTAMCA - v2.0.0")
            self.root.geometry("800x600")
            
            # Configurar redimensionamiento
            self.root.resizable(True, True)
            self.root.minsize(700, 500)
            
            # ============ 3. INICIALIZAR COMPONENTES DE UI PRIMERO ============
            self.status_text = None
            self.logs_text = None
            self.req_widgets = {}
            
            # ============ 4. ESTILO Y TEMA ============
            self.style = ttk.Style()
            self._configurar_temas()
            
            # ============ 5. PALETA DE COLORES ============
            self.colors = self._definir_paleta_colores()
            
            # ============ 6. CONFIGURACIÓN DEL SISTEMA ============
            self.config = self._definir_configuracion_corregida()
            
            # ============ 7. VARIABLES DE ESTADO ============
            self.server_process = None
            self.is_windows = os.name == 'nt'
            self.is_server_running = False
            self.server_start_time = None
            self.shutdown_flag = False
            
            # ============ 8. CONFIGURACIONES INICIALES ============
            self._configurar_manejo_señales()
            
            # ============ 9. CARGAR ICONO ============
            self._cargar_icono_corregido()
            
            # ============ 10. CARGAR CONFIGURACIÓN GUARDADA ============
            self._cargar_configuracion_guardada()
            
            # ============ 11. CREAR DIRECTORIOS ============
            self._crear_directorios_necesarios_corregido()
            
            # ============ 12. CONFIGURAR UI ============
            self._setup_ui()
            
            # Centrar ventana
            self._center_window()
            
            # Mostrar mensaje inicial
            if self.status_text:
                self.actualizar_status("Sistema inicializado correctamente")
            
            # Verificar requisitos después de un breve retraso
            self.root.after(1000, self.verificar_prerequisitos_gui)
            
        except Exception as e:
            error_msg = f"No se pudo inicializar la aplicación:\n{str(e)}\n\nDirectorio: {self.app_dir}"
            messagebox.showerror("Error de Inicialización", error_msg)
            print(f"Error de inicialización: {e}")
            import traceback
            traceback.print_exc()
            if hasattr(self, 'root') and self.root:
                self.root.destroy()
            raise

    def _cargar_icono_corregido(self):
        """Carga el icono de la aplicación - RUTAS CORREGIDAS"""
        try:
            posibles_rutas = [
                self.app_dir / "icon.ico",
                self.app_dir / "resources" / "icon.ico",
                self.app_dir.parent / "icon.ico",
                self.app_dir.parent / "resources" / "icon.ico",
            ]
            
            for icon_path in posibles_rutas:
                if icon_path.exists():
                    self.root.iconbitmap(str(icon_path))
                    print(f"Icono cargado desde: {icon_path}")
                    return
            
            print("Advertencia: No se encontró icon.ico en ninguna ubicación")
        except Exception as e:
            print(f"Error cargando icono: {e}")

    def _configurar_temas(self):
        """Configura los temas de la aplicación"""
        available_themes = self.style.theme_names()
        if available_themes:
            self.style.theme_use(available_themes[0])

    def _definir_paleta_colores(self):
        """Define la paleta de colores institucional"""
        return {
            'primary': '#1C75BA',
            'primary_light': '#4A9CE3',
            'primary_dark': '#0A4A7A',
            'secondary': '#FE8012',
            'secondary_light': '#FFA347',
            'secondary_dark': '#C35A00',
            'success': '#28a745',
            'danger': '#dc3545',
            'warning': '#ffc107',
            'info': '#17a2b8',
            'bg_light': '#f8f9fa',
            'text_primary': '#212529',
            'text_secondary': '#6c757d',
            'text_light': '#f8f9fa',
        }

    def _definir_configuracion_corregida(self):
        """Define la configuración del sistema - RUTAS CORREGIDAS"""
        server_dir = self.app_dir / "server"
        client_dir = self.app_dir / "client"
        
        return {
            "app_name": "Sistema UPTAMCA",
            "version": "2.0.0",
            "server_port": 3000,
            "server_url": "http://localhost:3000",
            "app_root": self.app_dir,
            "server_dir": server_dir,
            "client_dir": client_dir,
            "package_json": server_dir / "package.json",
            "config_file": self.app_dir / "config.json",
            "log_file": self.app_dir / "uptamca.log",
        }

    def _cargar_configuracion_guardada(self):
        """Carga la configuración guardada desde archivo"""
        config_file = self.config['config_file']
        if config_file.exists():
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    saved_config = json.load(f)
                
                if 'server_port' in saved_config:
                    self.config['server_port'] = saved_config['server_port']
                    self.config['server_url'] = f"http://localhost:{saved_config['server_port']}"
            except Exception as e:
                print(f"Error cargando configuración: {e}")

    def _guardar_configuracion(self):
        """Guarda la configuración actual en archivo"""
        try:
            config_to_save = {
                'server_port': self.config['server_port'],
                'last_updated': datetime.now().isoformat(),
                'app_dir': str(self.app_dir),
                'version': self.config['version']
            }
            
            with open(self.config['config_file'], 'w', encoding='utf-8') as f:
                json.dump(config_to_save, f, indent=2)
            print(f"Configuración guardada en: {self.config['config_file']}")
        except Exception as e:
            print(f"Error guardando configuración: {e}")

    def _crear_directorios_necesarios_corregido(self):
        """Crea directorios necesarios - RUTAS CORREGIDAS"""
        try:
            directorios = [
                self.config["server_dir"],
                self.config["client_dir"],
                self.app_dir / "logs",
                self.app_dir / "data",
            ]
            
            for directorio in directorios:
                directorio.mkdir(parents=True, exist_ok=True)
                print(f"Directorio creado/verificado: {directorio}")
            
        except Exception as e:
            print(f"Error creando directorios: {e}")

    def _setup_ui(self):
        """Configura la interfaz de usuario"""
        # Configurar grid principal
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(1, weight=1)
        
        # Header
        self._setup_header()
        
        # Contenido principal
        self._setup_main_content()
        
        # Panel de control
        self._setup_control_panel()

    def _setup_header(self):
        """Configura el header"""
        header_frame = tk.Frame(
            self.root,
            bg=self.colors['primary'],
            height=60
        )
        header_frame.grid(row=0, column=0, sticky="ew", padx=0, pady=0)
        header_frame.grid_propagate(False)
        
        title_label = tk.Label(
            header_frame,
            text="SISTEMA UPTAMCA v2.0.0",
            font=('Arial', 16, 'bold'),
            fg='white',
            bg=self.colors['primary']
        )
        title_label.pack(side=tk.LEFT, padx=20, pady=10)
        
        subtitle_label = tk.Label(
            header_frame,
            text="Universidad Politécnica Territorial Cecilio Acosta",
            font=('Arial', 9),
            fg='white',
            bg=self.colors['primary']
        )
        subtitle_label.pack(side=tk.LEFT, pady=10)

    def _setup_main_content(self):
        """Configura el área de contenido principal"""
        main_frame = tk.Frame(self.root, bg=self.colors['bg_light'])
        main_frame.grid(row=1, column=0, sticky="nsew", padx=10, pady=10)
        main_frame.columnconfigure(0, weight=1)
        main_frame.rowconfigure(0, weight=1)
        
        self.notebook = ttk.Notebook(main_frame)
        self.notebook.grid(row=0, column=0, sticky="nsew")
        
        # Pestaña Dashboard
        self.tab_dashboard = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_dashboard, text="Dashboard")
        self._setup_dashboard_tab()
        
        # Pestaña Configuración
        self.tab_config = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_config, text="Configuración")
        self._setup_config_tab()
        
        # Pestaña Logs
        self.tab_logs = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_logs, text="Logs")
        self._setup_logs_tab()

    def _setup_dashboard_tab(self):
        """Configura el dashboard"""
        dashboard_frame = ttk.Frame(self.tab_dashboard)
        dashboard_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Información del sistema
        info_frame = ttk.LabelFrame(dashboard_frame, text="Información del Sistema", padding=10)
        info_frame.pack(fill=tk.X, pady=(0, 10))
        
        info_grid = tk.Frame(info_frame)
        info_grid.pack(fill=tk.X)
        
        app_dir_short = str(self.app_dir)
        if len(app_dir_short) > 50:
            app_dir_short = "..." + app_dir_short[-47:]
        
        info_data = [
            ("Sistema:", f"{platform.system()} {platform.release()}"),
            ("Python:", platform.python_version()),
            ("Directorio:", app_dir_short),
            ("Tipo:", "Ejecutable" if getattr(sys, 'frozen', False) else "Script"),
            ("Puerto:", str(self.config['server_port'])),
            ("Fecha:", datetime.now().strftime('%d/%m/%Y %H:%M:%S')),
        ]
        
        for i, (label, value) in enumerate(info_data):
            tk.Label(info_grid, text=label, font=('Arial', 9, 'bold'), anchor='w').grid(
                row=i, column=0, sticky='w', pady=2, padx=(0, 5))
            tk.Label(info_grid, text=value, font=('Arial', 9), anchor='w').grid(
                row=i, column=1, sticky='w', pady=2)
        
        # Estado del servidor
        status_frame = ttk.LabelFrame(dashboard_frame, text="Estado del Servidor", padding=10)
        status_frame.pack(fill=tk.X, pady=(0, 10))
        
        self.status_text = scrolledtext.ScrolledText(
            status_frame,
            height=6,
            font=('Consolas', 9),
            wrap=tk.WORD,
            bg='#f5f5f5'
        )
        self.status_text.pack(fill=tk.BOTH, expand=True)
        
        # Requisitos del sistema
        req_frame = ttk.LabelFrame(dashboard_frame, text="Requisitos del Sistema", padding=10)
        req_frame.pack(fill=tk.X)
        
        requisitos = [
            ("Node.js", "node_status"),
            ("npm", "npm_status"),
            ("Carpeta Server", "server_status"),
            ("Carpeta Client", "client_status"),
            ("Dependencias", "deps_status")
        ]
        
        for i, (nombre, key) in enumerate(requisitos):
            frame = tk.Frame(req_frame)
            frame.pack(fill=tk.X, pady=2)
            
            tk.Label(frame, text=f"{nombre}:", 
                    font=('Arial', 9, 'bold'), anchor='w', width=15).pack(side=tk.LEFT)
            
            label = tk.Label(frame, text="Verificando...", 
                            font=('Arial', 9), fg='orange', anchor='w')
            label.pack(side=tk.LEFT, padx=(10, 0), fill=tk.X, expand=True)
            
            self.req_widgets[key] = label

    def _setup_config_tab(self):
        """Configura la pestaña de configuración"""
        config_frame = ttk.Frame(self.tab_config)
        config_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Configuración del puerto
        port_frame = ttk.LabelFrame(config_frame, text="Configuración del Servidor", padding=10)
        port_frame.pack(fill=tk.X, pady=(0, 10))
        
        tk.Label(port_frame, text="Puerto del servidor:").grid(row=0, column=0, sticky='w', pady=5)
        self.port_var = tk.StringVar(value=str(self.config['server_port']))
        port_entry = ttk.Entry(port_frame, textvariable=self.port_var, width=10)
        port_entry.grid(row=0, column=1, sticky='w', padx=5, pady=5)
        
        ttk.Button(port_frame, text="Aplicar Cambios", command=self.actualizar_config).grid(row=0, column=2, padx=10)
        
        # Herramientas
        tools_frame = ttk.LabelFrame(config_frame, text="Herramientas", padding=10)
        tools_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Button(tools_frame, text="Reinstalar Dependencias", 
                  command=self.reinstalar_dependencias).pack(anchor='w', pady=2)
        
        ttk.Button(tools_frame, text="Actualizar Dependencias", 
                  command=self.actualizar_dependencias).pack(anchor='w', pady=2)
        
        ttk.Button(tools_frame, text="Verificar Estado del Servidor", 
                  command=self.verificar_estado_servidor_gui).pack(anchor='w', pady=2)
        
        ttk.Button(tools_frame, text="Verificar Rutas", 
                  command=self.verificar_rutas_gui).pack(anchor='w', pady=2)
        
        # Información
        info_frame = ttk.LabelFrame(config_frame, text="Información", padding=10)
        info_frame.pack(fill=tk.X)
        
        info_text = f"""Aplicación: {self.config['app_name']}
Versión: {self.config['version']}
URL: {self.config['server_url']}
Directorio: {self.app_dir}"""
        
        tk.Label(info_frame, text=info_text, font=('Arial', 9), justify='left', anchor='w').pack(fill=tk.X)

    def _setup_logs_tab(self):
        """Configura la pestaña de logs"""
        logs_frame = ttk.Frame(self.tab_logs)
        logs_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        self.logs_text = scrolledtext.ScrolledText(
            logs_frame,
            height=15,
            font=('Consolas', 9),
            wrap=tk.WORD,
            bg='#1e1e1e',
            fg='#ffffff'
        )
        self.logs_text.pack(fill=tk.BOTH, expand=True)
        
        button_frame = ttk.Frame(logs_frame)
        button_frame.pack(fill=tk.X, pady=(5, 0))
        
        ttk.Button(button_frame, text="Limpiar Logs", 
                  command=self.limpiar_logs).pack(side=tk.LEFT, padx=5)
        
        ttk.Button(button_frame, text="Guardar Logs", 
                  command=self.guardar_logs).pack(side=tk.LEFT, padx=5)

    def _setup_control_panel(self):
        """Configura el panel de control inferior"""
        self.control_frame = ttk.Frame(self.root)
        self.control_frame.grid(row=2, column=0, sticky="ew", padx=10, pady=10)
        
        self.status_label = tk.Label(
            self.control_frame,
            text="Estado: DETENIDO",
            font=('Arial', 10, 'bold'),
            fg=self.colors['danger']
        )
        self.status_label.pack(side=tk.LEFT, padx=10)
        
        button_frame = ttk.Frame(self.control_frame)
        button_frame.pack(side=tk.RIGHT)
        
        self.start_button = ttk.Button(
            button_frame,
            text="▶ Iniciar Servidor",
            command=self.iniciar_servidor_gui
        )
        self.start_button.pack(side=tk.LEFT, padx=5)
        
        self.stop_button = ttk.Button(
            button_frame,
            text="⏹ Detener Servidor",
            command=self.detener_servidor_gui,
            state='disabled'
        )
        self.stop_button.pack(side=tk.LEFT, padx=5)
        
        self.browser_button = ttk.Button(
            button_frame,
            text="🌐 Abrir Navegador",
            command=self.abrir_navegador_gui,
            state='disabled'
        )
        self.browser_button.pack(side=tk.LEFT, padx=5)

    def _center_window(self):
        """Centra la ventana en la pantalla"""
        self.root.update_idletasks()
        width = self.root.winfo_width()
        height = self.root.winfo_height()
        x = (self.root.winfo_screenwidth() // 2) - (width // 2)
        y = (self.root.winfo_screenheight() // 2) - (height // 2)
        self.root.geometry(f'{width}x{height}+{x}+{y}')

    def _configurar_manejo_señales(self):
        """Configura el manejo de señales"""
        signal.signal(signal.SIGINT, self._manejar_salida)
        signal.signal(signal.SIGTERM, self._manejar_salida)

    def _manejar_salida(self, signum, frame):
        """Maneja señales de salida"""
        self.detener_servidor_gui()
        time.sleep(1)
        self.root.quit()
        sys.exit(0)

    def actualizar_status(self, message):
        """Actualiza el estado en el dashboard"""
        current_time = datetime.now().strftime('%H:%M:%S')
        status = f"{current_time} - {message}\n"
        if self.status_text:
            self.status_text.insert(tk.END, status)
            self.status_text.see(tk.END)
        
        # Agregar a logs solo si logs_text ya está inicializado
        if self.logs_text is not None:
            self.logs_text.insert(tk.END, status)
            self.logs_text.see(tk.END)

    def agregar_log(self, message):
        """Agrega un mensaje a los logs"""
        if self.logs_text is not None:
            current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            log_entry = f"[{current_time}] {message}\n"
            self.logs_text.insert(tk.END, log_entry)
            self.logs_text.see(tk.END)

    def limpiar_logs(self):
        """Limpia los logs"""
        if self.logs_text is not None:
            self.logs_text.delete(1.0, tk.END)

    def guardar_logs(self):
        """Guarda los logs a un archivo"""
        try:
            if self.logs_text is None:
                messagebox.showerror("Error", "Logs no inicializados")
                return
                
            log_file = self.config['log_file']
            logs_content = self.logs_text.get(1.0, tk.END)
            
            with open(log_file, 'w', encoding='utf-8') as f:
                f.write(logs_content)
            
            messagebox.showinfo("Éxito", f"Logs guardados en:\n{log_file}")
        except Exception as e:
            messagebox.showerror("Error", f"No se pudieron guardar los logs:\n{e}")

    def verificar_rutas_gui(self):
        """Verifica las rutas críticas del sistema"""
        rutas_verificar = [
            ("Directorio App", self.app_dir, True),
            ("Server Dir", self.config['server_dir'], True),
            ("Client Dir", self.config['client_dir'], True),
            ("package.json", self.config['package_json'], False),
            ("config.json", self.config['config_file'], False),
        ]
        
        reporte = "=== VERIFICACIÓN DE RUTAS ===\n"
        for nombre, ruta, es_directorio in rutas_verificar:
            existe = ruta.exists()
            tipo = "Directorio" if es_directorio else "Archivo"
            estado = "✓ EXISTE" if existe else "✗ NO EXISTE"
            reporte += f"{nombre}: {estado} ({tipo})\n"
            reporte += f"  Ruta: {ruta}\n"
            
            if existe and es_directorio:
                try:
                    contenido = list(ruta.iterdir())
                    reporte += f"  Contenido: {len(contenido)} items\n"
                    for item in contenido[:5]:
                        reporte += f"    - {item.name}\n"
                    if len(contenido) > 5:
                        reporte += f"    ... y {len(contenido)-5} más\n"
                except Exception as e:
                    reporte += f"  Error leyendo: {e}\n"
        
        messagebox.showinfo("Verificación de Rutas", reporte)
        # Solo agregar log si logs_text está inicializado
        if self.logs_text is not None:
            self.agregar_log("Verificación de rutas completada")

    def verificar_prerequisitos_gui(self):
        """Verifica los prerequisitos"""
        self.actualizar_status("Verificando prerequisitos...")
        
        # Verificar Node.js
        node_ok = self._verificar_nodejs_gui()
        self.req_widgets['node_status'].config(
            text="OK ✓" if node_ok else "ERROR ✗", 
            fg='green' if node_ok else 'red'
        )
        
        # Verificar npm
        npm_ok = self._verificar_npm_gui()
        self.req_widgets['npm_status'].config(
            text="OK ✓" if npm_ok else "ERROR ✗", 
            fg='green' if npm_ok else 'red'
        )
        
        # Verificar carpeta server
        server_ok = self.config['server_dir'].exists()
        self.req_widgets['server_status'].config(
            text="OK ✓" if server_ok else "NO EXISTE ✗", 
            fg='green' if server_ok else 'red'
        )
        
        # Verificar carpeta client
        client_ok = self.config['client_dir'].exists()
        self.req_widgets['client_status'].config(
            text="OK ✓" if client_ok else "NO EXISTE ✗", 
            fg='green' if client_ok else 'red'
        )
        
        # Verificar dependencias
        deps_ok = self._verificar_dependencias_gui()
        self.req_widgets['deps_status'].config(
            text="OK ✓" if deps_ok else "FALTANTE", 
            fg='green' if deps_ok else 'orange'
        )
        
        if server_ok:
            try:
                server_items = list(self.config['server_dir'].iterdir())
                server_info = f" ({len(server_items)} archivos)"
                self.req_widgets['server_status'].config(
                    text=f"OK ✓{server_info}"
                )
            except:
                pass
        
        self.actualizar_status("Prerequisitos verificados")

    def _verificar_nodejs_gui(self):
        """Verifica si Node.js está instalado"""
        try:
            resultado = subprocess.run(
                ['node', '--version'], 
                capture_output=True, 
                text=True, 
                timeout=5,
                shell=self.is_windows
            )
            if resultado.returncode == 0:
                # Solo agregar log si logs_text está inicializado
                if self.logs_text is not None:
                    self.agregar_log(f"Node.js encontrado: {resultado.stdout.strip()}")
                return True
            return False
        except Exception as e:
            if self.logs_text is not None:
                self.agregar_log(f"Error verificando Node.js: {e}")
            return False

    def _verificar_npm_gui(self):
        """Verifica si npm está instalado"""
        try:
            resultado = subprocess.run(
                ['npm', '--version'], 
                capture_output=True, 
                text=True, 
                timeout=5,
                shell=self.is_windows
            )
            if resultado.returncode == 0:
                if self.logs_text is not None:
                    self.agregar_log(f"npm encontrado: {resultado.stdout.strip()}")
                return True
            return False
        except Exception as e:
            if self.logs_text is not None:
                self.agregar_log(f"Error verificando npm: {e}")
            return False

    def _verificar_dependencias_gui(self):
        """Verifica si las dependencias están instaladas"""
        try:
            node_modules = self.config['server_dir'] / "node_modules"
            existe = node_modules.exists() and any(node_modules.iterdir())
            if existe and self.logs_text is not None:
                self.agregar_log("Dependencias encontradas")
            return existe
        except Exception as e:
            if self.logs_text is not None:
                self.agregar_log(f"Error verificando dependencias: {e}")
            return False

    def iniciar_servidor_gui(self):
        """Inicia el servidor"""
        self.start_button.config(state='disabled')
        self.actualizar_status("Iniciando servidor...")
        if self.logs_text is not None:
            self.agregar_log("Iniciando servidor...")
        
        thread = threading.Thread(target=self._iniciar_servidor_thread)
        thread.daemon = True
        thread.start()

    def _iniciar_servidor_thread(self):
        """Hilo para iniciar el servidor"""
        try:
            if self.logs_text is not None:
                self.agregar_log(f"Directorio servidor: {self.config['server_dir']}")
            
            # Instalar dependencias si es necesario
            self.actualizar_status("Verificando dependencias...")
            if not self._instalar_dependencias_gui():
                self.actualizar_status("Error al instalar dependencias")
                self._finalizar_inicio_server(False)
                return
            
            # Iniciar servidor
            self.actualizar_status("Iniciando servicios...")
            
            original_cwd = os.getcwd()
            os.chdir(self.config['server_dir'])
            
            if self.logs_text is not None:
                self.agregar_log(f"Directorio de trabajo: {os.getcwd()}")
            
            self.server_process = subprocess.Popen(
                ['npm', 'start'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding='utf-8',
                shell=self.is_windows,
                bufsize=1
            )
            
            if self.logs_text is not None:
                self.agregar_log("Proceso npm start iniciado")
            
            self.server_start_time = datetime.now()
            
            for i in range(30):
                if self._verificar_servidor_listo():
                    tiempo_inicio = (datetime.now() - self.server_start_time).total_seconds()
                    self.actualizar_status(f"Servidor iniciado en {tiempo_inicio:.1f} segundos")
                    self._finalizar_inicio_server(True)
                    return
                self.actualizar_status(f"Esperando servidor... ({i+1}/30)")
                time.sleep(2)
            
            self.actualizar_status("Timeout: El servidor tardó demasiado en iniciar")
            self._finalizar_inicio_server(False)
            
        except Exception as e:
            error_msg = f"Error al iniciar servidor: {str(e)}"
            self.actualizar_status(error_msg)
            if self.logs_text is not None:
                self.agregar_log(error_msg)
            self._finalizar_inicio_server(False)
        finally:
            try:
                os.chdir(original_cwd)
            except:
                pass

    def _instalar_dependencias_gui(self):
        """Instala las dependencias del servidor"""
        try:
            node_modules = self.config['server_dir'] / "node_modules"
            
            if not node_modules.exists() or not any(node_modules.iterdir()):
                self.actualizar_status("Instalando dependencias...")
                if self.logs_text is not None:
                    self.agregar_log("Instalando dependencias con npm install...")
                
                resultado = subprocess.run(
                    ['npm', 'install'],
                    capture_output=True,
                    text=True,
                    timeout=300,
                    shell=self.is_windows,
                    cwd=str(self.config['server_dir'])
                )
                
                if self.logs_text is not None:
                    self.agregar_log(f"npm install salida: {resultado.stdout[:500]}")
                    if resultado.stderr:
                        self.agregar_log(f"npm install errores: {resultado.stderr[:500]}")
                
                if resultado.returncode == 0:
                    self.actualizar_status("Dependencias instaladas")
                    self.req_widgets['deps_status'].config(text="OK ✓", fg='green')
                    return True
                else:
                    if self.logs_text is not None:
                        self.agregar_log(f"npm install falló con código: {resultado.returncode}")
                    return False
            else:
                self.req_widgets['deps_status'].config(text="OK ✓", fg='green')
                if self.logs_text is not None:
                    self.agregar_log("Dependencias ya instaladas")
                return True
                
        except Exception as e:
            if self.logs_text is not None:
                self.agregar_log(f"Error instalando dependencias: {e}")
            return False

    def _verificar_servidor_listo(self):
        """Verifica si el servidor está listo"""
        try:
            respuesta = requests.get(
                f"{self.config['server_url']}/api/health",
                timeout=2,
                verify=False
            )
            if respuesta.status_code == 200:
                if self.logs_text is not None:
                    self.agregar_log(f"Servidor responde: {respuesta.status_code}")
                return True
            else:
                if self.logs_text is not None:
                    self.agregar_log(f"Servidor responde con código: {respuesta.status_code}")
                return False
        except Exception as e:
            if self.logs_text is not None:
                self.agregar_log(f"Error verificando servidor: {e}")
            return False

    def _finalizar_inicio_server(self, success):
        """Finaliza el inicio del servidor"""
        self.root.after(0, lambda: self._actualizar_ui_inicio_server(success))

    def _actualizar_ui_inicio_server(self, success):
        """Actualiza la UI después de iniciar el servidor"""
        if success:
            self.is_server_running = True
            self.status_label.config(
                text="Estado: EN EJECUCIÓN ✓",
                fg='green'
            )
            self.start_button.config(state='disabled')
            self.stop_button.config(state='normal')
            self.browser_button.config(state='normal')
            if self.logs_text is not None:
                self.agregar_log("Servidor iniciado correctamente")
        else:
            self.is_server_running = False
            self.status_label.config(
                text="Estado: ERROR ✗",
                fg='red'
            )
            self.start_button.config(state='normal')
            self.stop_button.config(state='disabled')
            self.browser_button.config(state='disabled')
            if self.logs_text is not None:
                self.agregar_log("Error iniciando servidor")

    def detener_servidor_gui(self):
        """Detiene el servidor"""
        self.stop_button.config(state='disabled')
        self.actualizar_status("Deteniendo servidor...")
        if self.logs_text is not None:
            self.agregar_log("Deteniendo servidor...")
        
        thread = threading.Thread(target=self._detener_servidor_thread)
        thread.daemon = True
        thread.start()

    def _detener_servidor_thread(self):
        """Hilo para detener el servidor"""
        try:
            if self.server_process:
                if self.server_process.poll() is None:
                    self.server_process.terminate()
                    try:
                        self.server_process.wait(timeout=10)
                    except subprocess.TimeoutExpired:
                        self.server_process.kill()
                        self.server_process.wait()
                    
                    self.server_process = None
                    self.server_start_time = None
                    self.actualizar_status("Servidor detenido")
                    if self.logs_text is not None:
                        self.agregar_log("Servidor detenido correctamente")
                else:
                    self.actualizar_status("Servidor ya estaba detenido")
            
            self.root.after(0, self._actualizar_ui_detener_server)
            
        except Exception as e:
            error_msg = f"Error al detener servidor: {e}"
            self.actualizar_status(error_msg)
            if self.logs_text is not None:
                self.agregar_log(error_msg)
            self.root.after(0, lambda: self._actualizar_ui_detener_server(False))

    def _actualizar_ui_detener_server(self, success=True):
        """Actualiza la UI después de detener el servidor"""
        if success:
            self.is_server_running = False
            self.status_label.config(
                text="Estado: DETENIDO",
                fg='red'
            )
            self.start_button.config(state='normal')
            self.stop_button.config(state='disabled')
            self.browser_button.config(state='disabled')

    def abrir_navegador_gui(self):
        """Abre el navegador web"""
        try:
            webbrowser.open(self.config['server_url'])
            self.actualizar_status(f"Aplicación abierta en navegador")
            if self.logs_text is not None:
                self.agregar_log(f"Navegador abierto en: {self.config['server_url']}")
        except Exception as e:
            error_msg = f"Error al abrir navegador: {e}"
            self.actualizar_status(error_msg)
            if self.logs_text is not None:
                self.agregar_log(error_msg)
            messagebox.showerror("Error", f"No se pudo abrir el navegador:\n{e}")

    def verificar_estado_servidor_gui(self):
        """Verifica el estado del servidor"""
        if not self.is_server_running:
            messagebox.showinfo("Estado", "El servidor no está en ejecución")
            return
        
        self.actualizar_status("Verificando estado del servidor...")
        
        try:
            respuesta = requests.get(f"{self.config['server_url']}/api/health", timeout=5)
            if respuesta.status_code == 200:
                uptime = datetime.now() - self.server_start_time
                horas = uptime.seconds // 3600
                minutos = (uptime.seconds % 3600) // 60
                segundos = uptime.seconds % 60
                
                mensaje = f"Servidor funcionando correctamente\n"
                mensaje += f"Tiempo activo: {horas:02d}:{minutos:02d}:{segundos:02d}\n"
                mensaje += f"URL: {self.config['server_url']}"
                
                messagebox.showinfo("Estado", mensaje)
                self.actualizar_status("Servidor funcionando correctamente")
                if self.logs_text is not None:
                    self.agregar_log(f"Estado servidor: OK (uptime: {horas}:{minutos}:{segundos})")
            else:
                messagebox.showwarning("Estado", f"Servidor respondió con código: {respuesta.status_code}")
                self.actualizar_status(f"Servidor respondió con código: {respuesta.status_code}")
                if self.logs_text is not None:
                    self.agregar_log(f"Estado servidor: Código {respuesta.status_code}")
        except Exception as e:
            messagebox.showerror("Estado", f"Error al conectar con el servidor: {e}")
            self.actualizar_status(f"Error al conectar con servidor: {e}")
            if self.logs_text is not None:
                self.agregar_log(f"Error conexión servidor: {e}")

    def actualizar_config(self):
        """Actualiza la configuración"""
        try:
            new_port = int(self.port_var.get())
            if 1024 <= new_port <= 65535:
                old_port = self.config['server_port']
                self.config['server_port'] = new_port
                self.config['server_url'] = f"http://localhost:{new_port}"
                
                self._guardar_configuracion()
                
                mensaje = f"Puerto actualizado de {old_port} a {new_port}"
                self.actualizar_status(mensaje)
                if self.logs_text is not None:
                    self.agregar_log(mensaje)
                
                messagebox.showinfo("Éxito", 
                    f"Puerto actualizado a {new_port}\n\nReiniciar el servidor para aplicar cambios.")
            else:
                messagebox.showerror("Error", "El puerto debe estar entre 1024 y 65535")
        except ValueError:
            messagebox.showerror("Error", "Por favor ingrese un número válido")

    def reinstalar_dependencias(self):
        """Reinstala las dependencias"""
        if messagebox.askyesno("Confirmar", "¿Reinstalar todas las dependencias?"):
            self.actualizar_status("Reinstalando dependencias...")
            if self.logs_text is not None:
                self.agregar_log("Reinstalando dependencias...")
            
            was_running = self.is_server_running
            if was_running:
                self.detener_servidor_gui()
                time.sleep(2)
            
            node_modules = self.config['server_dir'] / "node_modules"
            if node_modules.exists():
                try:
                    shutil.rmtree(node_modules)
                    self.req_widgets['deps_status'].config(text="ELIMINADO", fg='orange')
                    if self.logs_text is not None:
                        self.agregar_log("node_modules eliminado")
                except Exception as e:
                    error_msg = f"No se pudo eliminar node_modules: {e}"
                    messagebox.showerror("Error", error_msg)
                    if self.logs_text is not None:
                        self.agregar_log(error_msg)
                    return
            
            if self._instalar_dependencias_gui():
                messagebox.showinfo("Éxito", "Dependencias reinstaladas correctamente")
                if self.logs_text is not None:
                    self.agregar_log("Dependencias reinstaladas correctamente")
                
                if was_running:
                    self.root.after(2000, self.iniciar_servidor_gui)
            else:
                messagebox.showerror("Error", "Error al reinstalar dependencias")
                if self.logs_text is not None:
                    self.agregar_log("Error reinstalando dependencias")

    def actualizar_dependencias(self):
        """Actualiza las dependencias"""
        if messagebox.askyesno("Confirmar", "¿Actualizar dependencias?"):
            self.actualizar_status("Actualizando dependencias...")
            if self.logs_text is not None:
                self.agregar_log("Actualizando dependencias...")
            
            try:
                resultado = subprocess.run(
                    ['npm', 'update'],
                    capture_output=True,
                    text=True,
                    timeout=300,
                    shell=self.is_windows,
                    cwd=str(self.config['server_dir'])
                )
                
                if resultado.returncode == 0:
                    self.actualizar_status("Dependencias actualizadas")
                    if self.logs_text is not None:
                        self.agregar_log("Dependencias actualizadas correctamente")
                    messagebox.showinfo("Éxito", "Dependencias actualizadas correctamente")
                else:
                    messagebox.showerror("Error", "Error al actualizar dependencias")
                    if self.logs_text is not None:
                        self.agregar_log("Error actualizando dependencias")
                    
            except Exception as e:
                messagebox.showerror("Error", f"Error: {e}")
                if self.logs_text is not None:
                    self.agregar_log(f"Error ejecutando npm update: {e}")

    def run(self):
        """Ejecuta la aplicación GUI"""
        self.root.mainloop()

    def _on_closing(self):
        """Maneja el cierre de la ventana"""
        if self.is_server_running:
            if messagebox.askyesno("Confirmar", 
                                  "El servidor está en ejecución. ¿Detener servidor y salir?"):
                self.detener_servidor_gui()
                self.root.after(2000, self.root.destroy)
            else:
                return
        else:
            self.root.destroy()


def main():
    """Función principal con manejo de errores mejorado"""
    try:
        print("=== INICIANDO SISTEMA UPTAMCA ===")
        print(f"Python: {sys.version}")
        print(f"Plataforma: {platform.platform()}")
        
        app = SistemaUPTAMCAGUI()
        app.run()
        
    except Exception as e:
        print(f"ERROR CRÍTICO: {e}")
        import traceback
        traceback.print_exc()
        
        error_msg = f"""Error crítico en la aplicación:

{str(e)}

Por favor, contacte al soporte técnico."""
        
        messagebox.showerror("Error Crítico", error_msg)
        
        input("Presione Enter para salir...")


if __name__ == "__main__":
    main()