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
from tkinter import ttk, messagebox
from typing import Optional
import json
import shutil

class SistemaUPTAMCAGUI:
    def __init__(self):
        try:
            # 1. VENTANA PRINCIPAL
            self.root = tk.Tk()
            self.root.protocol("WM_DELETE_WINDOW", self._on_closing)
            
            # Configurar color de fondo
            self.root.configure(bg='#1C75BA')
            
            # Cargar icono
            self._cargar_icono()
            
            # Título y tamaño
            self.root.title("Sistema UPTAMCA - v2.0.0")
            self.root.geometry("800x600")
            
            # Configurar redimensionamiento
            self.root.resizable(True, True)
            self.root.minsize(700, 500)
            
            # 2. ESTILO Y TEMA
            self.style = ttk.Style()
            self._configurar_temas()
            
            # 3. PALETA DE COLORES
            self.colors = self._definir_paleta_colores()
            
            # 4. CONFIGURACIÓN DEL SISTEMA
            self.config = self._definir_configuracion()
            
            # Cargar configuración guardada si existe
            self._cargar_configuracion_guardada()
            
            # 5. VARIABLES DE ESTADO
            self.server_process = None
            self.is_windows = os.name == 'nt'
            self.is_server_running = False
            self.server_start_time = None
            self.shutdown_flag = False
            
            # 6. CONFIGURACIONES INICIALES
            self._configurar_manejo_señales()
            
            # Asegurar directorios necesarios
            self._crear_directorios_necesarios()
            
            # Configurar UI
            self._setup_ui()
            
            # Centrar ventana
            self._center_window()
            
            # Verificar requisitos
            self.root.after(500, self.verificar_prerequisitos_gui)
            
        except Exception as e:
            messagebox.showerror("Error de Inicialización", 
                               f"No se pudo inicializar la aplicación:\n{str(e)}")
            if hasattr(self, 'root') and self.root:
                self.root.destroy()
            raise

    def _cargar_icono(self):
        """Carga el icono de la aplicación"""
        try:
            icon_path = Path(__file__).parent.absolute() / '../installers' / 'resources' / 'icon.ico'
            if icon_path.exists():
                self.root.iconbitmap(str(icon_path))
        except Exception:
            pass

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

    def _definir_configuracion(self):
        """Define la configuración del sistema"""
        script_dir = Path(__file__).parent.absolute()
        server_dir = script_dir / "server"
        
        return {
            "app_name": "Sistema UPTAMCA",
            "version": "2.0.0",
            "server_port": 3000,
            "server_url": "http://localhost:3000",
            "app_root": script_dir,
            "server_dir": server_dir,
            "package_json": server_dir / "package.json",
            "config_file": script_dir / "config.json",
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
            except Exception:
                pass

    def _guardar_configuracion(self):
        """Guarda la configuración actual en archivo"""
        try:
            config_to_save = {
                'server_port': self.config['server_port'],
                'last_updated': datetime.now().isoformat()
            }
            
            with open(self.config['config_file'], 'w', encoding='utf-8') as f:
                json.dump(config_to_save, f, indent=2)
        except Exception:
            pass

    def _crear_directorios_necesarios(self):
        """Crea directorios necesarios"""
        try:
            server_dir = self.config["server_dir"]
            (server_dir / "data").mkdir(parents=True, exist_ok=True)
        except Exception:
            pass

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
        
        # Título
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
        
        # Notebook con pestañas
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

    def _setup_dashboard_tab(self):
        """Configura el dashboard"""
        dashboard_frame = ttk.Frame(self.tab_dashboard)
        dashboard_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Información del sistema
        info_frame = ttk.LabelFrame(dashboard_frame, text="Información del Sistema", padding=10)
        info_frame.pack(fill=tk.X, pady=(0, 10))
        
        info_grid = tk.Frame(info_frame)
        info_grid.pack(fill=tk.X)
        
        info_data = [
            ("Sistema:", f"{platform.system()} {platform.release()}"),
            ("Python:", platform.python_version()),
            ("Directorio:", str(self.config['app_root'])),
            ("Puerto:", str(self.config['server_port'])),
            ("Fecha:", datetime.now().strftime('%d/%m/%Y')),
        ]
        
        for i, (label, value) in enumerate(info_data):
            tk.Label(info_grid, text=label, font=('Arial', 9, 'bold'), anchor='w').grid(
                row=i, column=0, sticky='w', pady=2, padx=(0, 5))
            tk.Label(info_grid, text=value, font=('Arial', 9), anchor='w').grid(
                row=i, column=1, sticky='w', pady=2)
        
        # Estado del servidor
        status_frame = ttk.LabelFrame(dashboard_frame, text="Estado del Servidor", padding=10)
        status_frame.pack(fill=tk.X, pady=(0, 10))
        
        self.status_text = tk.Text(
            status_frame,
            height=4,
            font=('Arial', 9),
            wrap=tk.WORD,
            bg=self.colors['bg_light']
        )
        self.status_text.pack(fill=tk.BOTH, expand=True)
        self.actualizar_status("Sistema inicializado. Verificando requisitos...")
        
        # Requisitos del sistema
        req_frame = ttk.LabelFrame(dashboard_frame, text="Requisitos del Sistema", padding=10)
        req_frame.pack(fill=tk.X)
        
        self.req_widgets = {}
        requisitos = [
            ("Node.js", "node_status"),
            ("npm", "npm_status"),
            ("Proyecto", "project_status"),
            ("Dependencias", "deps_status")
        ]
        
        for i, (nombre, key) in enumerate(requisitos):
            frame = tk.Frame(req_frame)
            frame.pack(fill=tk.X, pady=2)
            
            tk.Label(frame, text=f"{nombre}:", 
                    font=('Arial', 9, 'bold'), anchor='w').pack(side=tk.LEFT)
            
            label = tk.Label(frame, text="Verificando...", 
                            font=('Arial', 9), fg='orange', anchor='w')
            label.pack(side=tk.LEFT, padx=(10, 0))
            
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
        
        # Información
        info_frame = ttk.LabelFrame(config_frame, text="Información", padding=10)
        info_frame.pack(fill=tk.X)
        
        info_text = f"""Aplicación: {self.config['app_name']}
Versión: {self.config['version']}
URL: {self.config['server_url']}"""
        
        tk.Label(info_frame, text=info_text, font=('Arial', 9), justify='left', anchor='w').pack(fill=tk.X)

    def _setup_control_panel(self):
        """Configura el panel de control inferior"""
        self.control_frame = ttk.Frame(self.root)
        self.control_frame.grid(row=2, column=0, sticky="ew", padx=10, pady=10)
        
        # Estado del servidor
        self.status_label = tk.Label(
            self.control_frame,
            text="Estado: DETENIDO",
            font=('Arial', 10, 'bold'),
            fg=self.colors['danger']
        )
        self.status_label.pack(side=tk.LEFT, padx=10)
        
        # Botones
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
        self.status_text.insert(tk.END, status)
        self.status_text.see(tk.END)

    def verificar_prerequisitos_gui(self):
        """Verifica los prerequisitos"""
        self.actualizar_status("Verificando prerequisitos...")
        
        # Verificar Node.js
        if self._verificar_nodejs_gui():
            self.req_widgets['node_status'].config(text="OK ✓", fg='green')
        else:
            self.req_widgets['node_status'].config(text="ERROR ✗", fg='red')
            return
        
        # Verificar npm
        if self._verificar_npm_gui():
            self.req_widgets['npm_status'].config(text="OK ✓", fg='green')
        else:
            self.req_widgets['npm_status'].config(text="ERROR ✗", fg='red')
            return
        
        # Verificar estructura del proyecto
        if self._verificar_estructura_proyecto_gui():
            self.req_widgets['project_status'].config(text="OK ✓", fg='green')
        else:
            self.req_widgets['project_status'].config(text="ERROR ✗", fg='red')
            return
        
        # Verificar dependencias
        if self._verificar_dependencias_gui():
            self.req_widgets['deps_status'].config(text="OK ✓", fg='green')
        else:
            self.req_widgets['deps_status'].config(text="FALTANTE", fg='orange')
        
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
            return resultado.returncode == 0
        except Exception:
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
            return resultado.returncode == 0
        except Exception:
            return False

    def _verificar_estructura_proyecto_gui(self):
        """Verifica la estructura del proyecto"""
        try:
            if not self.config['server_dir'].exists():
                return False
            if not self.config['package_json'].exists():
                return False
            return True
        except Exception:
            return False

    def _verificar_dependencias_gui(self):
        """Verifica si las dependencias están instaladas"""
        try:
            node_modules = self.config['server_dir'] / "node_modules"
            return node_modules.exists() and any(node_modules.iterdir())
        except Exception:
            return False

    def iniciar_servidor_gui(self):
        """Inicia el servidor"""
        self.start_button.config(state='disabled')
        self.actualizar_status("Iniciando servidor...")
        
        # Ejecutar en un hilo separado
        thread = threading.Thread(target=self._iniciar_servidor_thread)
        thread.daemon = True
        thread.start()

    def _iniciar_servidor_thread(self):
        """Hilo para iniciar el servidor"""
        try:
            # Instalar dependencias si es necesario
            self.actualizar_status("Verificando dependencias...")
            if not self._instalar_dependencias_gui():
                self.actualizar_status("Error al instalar dependencias")
                self._finalizar_inicio_server(False)
                return
            
            # Iniciar servidor
            self.actualizar_status("Iniciando servicios...")
            
            # Cambiar al directorio del servidor
            original_cwd = os.getcwd()
            os.chdir(self.config['server_dir'])
            
            # Iniciar proceso
            self.server_process = subprocess.Popen(
                ['npm', 'start'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding='utf-8',
                shell=self.is_windows,
                bufsize=1
            )
            
            # Esperar a que el servidor esté listo
            self.server_start_time = datetime.now()
            
            for i in range(30):  # 30 intentos de 2 segundos
                if self._verificar_servidor_listo():
                    self.actualizar_status("Servidor iniciado correctamente")
                    self._finalizar_inicio_server(True)
                    return
                time.sleep(2)
            
            self.actualizar_status("Timeout: El servidor tardó demasiado en iniciar")
            self._finalizar_inicio_server(False)
            
        except Exception as e:
            self.actualizar_status(f"Error al iniciar servidor: {str(e)[:50]}")
            self._finalizar_inicio_server(False)
        finally:
            # Restaurar directorio
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
                
                resultado = subprocess.run(
                    ['npm', 'install'],
                    capture_output=True,
                    text=True,
                    timeout=300,
                    shell=self.is_windows,
                    cwd=str(self.config['server_dir'])
                )
                
                if resultado.returncode == 0:
                    self.actualizar_status("Dependencias instaladas")
                    self.req_widgets['deps_status'].config(text="OK ✓", fg='green')
                    return True
                else:
                    return False
            else:
                self.req_widgets['deps_status'].config(text="OK ✓", fg='green')
                return True
                
        except Exception:
            return False

    def _verificar_servidor_listo(self):
        """Verifica si el servidor está listo"""
        try:
            respuesta = requests.get(
                f"{self.config['server_url']}/api/health",
                timeout=2,
                verify=False
            )
            return respuesta.status_code == 200
        except:
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
        else:
            self.is_server_running = False
            self.status_label.config(
                text="Estado: ERROR ✗",
                fg='red'
            )
            self.start_button.config(state='normal')
            self.stop_button.config(state='disabled')
            self.browser_button.config(state='disabled')

    def detener_servidor_gui(self):
        """Detiene el servidor"""
        self.stop_button.config(state='disabled')
        self.actualizar_status("Deteniendo servidor...")
        
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
                else:
                    self.actualizar_status("Servidor ya estaba detenido")
            
            self.root.after(0, self._actualizar_ui_detener_server)
            
        except Exception as e:
            self.actualizar_status(f"Error al detener servidor: {e}")
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
        except Exception as e:
            self.actualizar_status(f"Error al abrir navegador: {e}")
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
                messagebox.showinfo("Estado", "Servidor funcionando correctamente")
                self.actualizar_status("Servidor funcionando correctamente")
            else:
                messagebox.showwarning("Estado", f"Servidor respondió con código: {respuesta.status_code}")
                self.actualizar_status(f"Servidor respondió con código: {respuesta.status_code}")
        except Exception as e:
            messagebox.showerror("Estado", f"Error al conectar con el servidor: {e}")
            self.actualizar_status(f"Error al conectar con servidor: {e}")

    def actualizar_config(self):
        """Actualiza la configuración"""
        try:
            new_port = int(self.port_var.get())
            if 1024 <= new_port <= 65535:
                old_port = self.config['server_port']
                self.config['server_port'] = new_port
                self.config['server_url'] = f"http://localhost:{new_port}"
                
                # Guardar configuración
                self._guardar_configuracion()
                
                self.actualizar_status(f"Puerto actualizado de {old_port} a {new_port}")
                messagebox.showinfo("Éxito", f"Puerto actualizado a {new_port}\n\nReiniciar el servidor para aplicar cambios.")
            else:
                messagebox.showerror("Error", "El puerto debe estar entre 1024 y 65535")
        except ValueError:
            messagebox.showerror("Error", "Por favor ingrese un número válido")

    def reinstalar_dependencias(self):
        """Reinstala las dependencias"""
        if messagebox.askyesno("Confirmar", "¿Reinstalar todas las dependencias?"):
            self.actualizar_status("Reinstalando dependencias...")
            
            # Detener servidor si está en ejecución
            was_running = self.is_server_running
            if was_running:
                self.detener_servidor_gui()
                time.sleep(2)
            
            # Eliminar node_modules si existe
            node_modules = self.config['server_dir'] / "node_modules"
            if node_modules.exists():
                try:
                    shutil.rmtree(node_modules)
                    self.req_widgets['deps_status'].config(text="ELIMINADO", fg='orange')
                except Exception as e:
                    messagebox.showerror("Error", f"No se pudo eliminar node_modules:\n{e}")
                    return
            
            # Reinstalar
            if self._instalar_dependencias_gui():
                messagebox.showinfo("Éxito", "Dependencias reinstaladas correctamente")
                
                # Reiniciar servidor si estaba en ejecución
                if was_running:
                    self.root.after(2000, self.iniciar_servidor_gui)
            else:
                messagebox.showerror("Error", "Error al reinstalar dependencias")

    def actualizar_dependencias(self):
        """Actualiza las dependencias"""
        if messagebox.askyesno("Confirmar", "¿Actualizar dependencias?"):
            self.actualizar_status("Actualizando dependencias...")
            
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
                    messagebox.showinfo("Éxito", "Dependencias actualizadas correctamente")
                else:
                    messagebox.showerror("Error", "Error al actualizar dependencias")
                    
            except Exception as e:
                messagebox.showerror("Error", f"Error: {e}")

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
                return  # Cancelar cierre
        else:
            self.root.destroy()


if __name__ == "__main__":
    try:
        app = SistemaUPTAMCAGUI()
        app.run()
    except Exception as e:
        print(f"Error: {e}")
        input("Presione Enter para salir...")