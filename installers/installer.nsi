; ============================================
; INSTALADOR SISTEMA UPTAMCA v2.0.0
; Configurado para estructura: installer/
; ============================================

Unicode true
Name "Sistema UPTAMCA"
Caption "Instalador Sistema UPTAMCA v2.0.0"
OutFile "..\dist\Instalar_UPTAMCA.exe"
InstallDir "$PROGRAMFILES\SistemaUPTAMCA"
InstallDirRegKey HKLM "Software\SistemaUPTAMCA" "InstallPath"
RequestExecutionLevel admin
ShowInstDetails show
ShowUninstDetails show

; ============================================
; ICONOS Y BANNERS (ajusta las rutas según tus archivos)
; ============================================
!define MUI_ICON "resources\icon.ico"
!define MUI_UNICON "resources\icon.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "resources\banner.bmp"    ; 150x57 pixels
!define MUI_HEADERIMAGE_RIGHT
!define MUI_WELCOMEFINISHPAGE_BITMAP "resources\banner.bmp" ; 164x314 pixels
!define MUI_WELCOMEPAGE_TITLE "Bienvenido al Sistema UPTAMCA"
!define MUI_WELCOMEPAGE_TEXT "Este asistente instalará el Sistema UPTAMCA v2.0.0 en su computadora.$\r$\n$\r$\nRecomendamos cerrar todas las aplicaciones antes de continuar."

; ============================================
; INCLUIR MÓDULOS
; ============================================
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "FileFunc.nsh"
!include "x64.nsh"
!include "WinVer.nsh"

; ============================================
; PÁGINAS DEL INSTALADOR
; ============================================
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "..\LICENSE"
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES

; Configurar página final
!define MUI_FINISHPAGE_TITLE "Instalación Completada"
!define MUI_FINISHPAGE_TEXT "El Sistema UPTAMCA ha sido instalado exitosamente."
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_TEXT "Iniciar Sistema UPTAMCA"
!define MUI_FINISHPAGE_RUN_FUNCTION "LaunchApp"
!define MUI_FINISHPAGE_SHOWREADME "$INSTDIR\Documentacion\Manual.pdf"
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Ver documentación"
!define MUI_FINISHPAGE_LINK "Visitar sitio web oficial"
!define MUI_FINISHPAGE_LINK_LOCATION "https://www.uptamca.edu.ve"
!define MUI_FINISHPAGE_NOREBOOTSUPPORT
!insertmacro MUI_PAGE_FINISH

; Páginas del desinstalador
!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; ============================================
; IDIOMA
; ============================================
!insertmacro MUI_LANGUAGE "Spanish"

; ============================================
; VARIABLES
; ============================================
Var AppName
Var AppVersion
Var InstallType
Var StartMenuFolder

; ============================================
; FUNCIONES PERSONALIZADAS
; ============================================

; Función para iniciar la aplicación
Function LaunchApp
  SetOutPath "$INSTDIR"
  Exec '"$INSTDIR\iniciar.bat"'
FunctionEnd

; Verificar si hay una instalación previa
Function .onInit
  StrCpy $AppName "Sistema UPTAMCA"
  StrCpy $AppVersion "2.0.0"
  
  ; Verificar Windows 7 o superior
  ${IfNot} ${AtLeastWin7}
    MessageBox MB_OK|MB_ICONSTOP "Este sistema requiere Windows 7 o superior."
    Quit
  ${EndIf}
  
  ; Verificar arquitectura
  ${If} ${RunningX64}
    SetRegView 64
  ${Else}
    MessageBox MB_OK|MB_ICONEXCLAMATION "Se recomienda usar Windows de 64 bits para mejor rendimiento."
  ${EndIf}
  
  ; Inicializar carpeta del menú inicio
  StrCpy $StartMenuFolder "Sistema UPTAMCA"
  
  ; Verificar instalación anterior
  ReadRegStr $0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SistemaUPTAMCA" "UninstallString"
  ${If} $0 != ""
    MessageBox MB_YESNO|MB_ICONQUESTION \
      "Se encontró una instalación previa de UPTAMCA. $\n$\n¿Desea desinstalarla antes de continuar?" \
      IDYES uninstallOld IDNO skipUninstall
      
    uninstallOld:
      ExecWait '$0 _?=$INSTDIR'
      Delete "$0"
      
    skipUninstall:
  ${EndIf}
FunctionEnd

; ============================================
; SECCIÓN PRINCIPAL (Siempre instalada)
; ============================================
Section "!Aplicación Principal" SecMain
  SectionIn RO
  
  SetOutPath "$INSTDIR"
  
  ; Mensaje de inicio
  DetailPrint "Instalando Sistema UPTAMCA v2.0.0..."
  
  ; ============================================
  ; 1. CREAR ESTRUCTURA DE CARPETAS
  ; ============================================
  CreateDirectory "$INSTDIR"
  CreateDirectory "$INSTDIR\server"
  CreateDirectory "$INSTDIR\client"
  CreateDirectory "$INSTDIR\database"
  CreateDirectory "$INSTDIR\logs"
  CreateDirectory "$INSTDIR\backups"
  CreateDirectory "$INSTDIR\config"
  CreateDirectory "$INSTDIR\Documentacion"
  
  ; ============================================
  ; 2. COPIAR ARCHIVOS DEL SERVIDOR
  ; ============================================
  DetailPrint "Copiando archivos del servidor..."
  SetOutPath "$INSTDIR\server"
  File /r "..\src\server\*.*"
  
  ; ============================================
  ; 3. COPIAR CLIENTE (React build)
  ; ============================================
  DetailPrint "Copiando interfaz web..."
  SetOutPath "$INSTDIR\client"
  
  ; Verificar si existe dist/ en el cliente
  ${If} ${FileExists} "..\src\client\dist\*.*"
    File /r "..\src\client\dist\*.*"
  ${Else}
    DetailPrint "Advertencia: No se encontró build del cliente"
  ${EndIf}
  
  ; ============================================
  ; 4. COPIAR ARCHIVOS PRINCIPALES
  ; ============================================
  SetOutPath "$INSTDIR"
  
  ; Script de inicio
  FileOpen $0 "$INSTDIR\iniciar.bat" w
  FileWrite $0 '@echo off$\r$\n'
  FileWrite $0 'chcp 65001 >nul$\r$\n'
  FileWrite $0 'title Sistema UPTAMCA v2.0.0$\r$\n'
  FileWrite $0 'echo.$\r$\n'
  FileWrite $0 'echo =========================================$\r$\n'
  FileWrite $0 'echo      SISTEMA UPTAMCA - Iniciando...$\r$\n'
  FileWrite $0 'echo =========================================$\r$\n'
  FileWrite $0 'echo.$\r$\n'
  FileWrite $0 'cd /d "%~dp0server"$\r$\n'
  FileWrite $0 '$\r$\n'
  FileWrite $0 ':: Verificar Node.js$\r$\n'
  FileWrite $0 'where node >nul 2>nul$\r$\n'
  FileWrite $0 'if errorlevel 1 ($\r$\n'
  FileWrite $0 '  echo ERROR: Node.js no está instalado$\r$\n'
  FileWrite $0 '  echo.$\r$\n'
  FileWrite $0 '  echo Instale Node.js desde: https://nodejs.org$\r$\n'
  FileWrite $0 '  pause$\r$\n'
  FileWrite $0 '  exit /b 1$\r$\n'
  FileWrite $0 ')$\r$\n'
  FileWrite $0 '$\r$\n'
  FileWrite $0 ':: Instalar dependencias si es necesario$\r$\n'
  FileWrite $0 'if not exist "node_modules" ($\r$\n'
  FileWrite $0 '  echo Instalando dependencias...$\r$\n'
  FileWrite $0 '  call npm install --silent$\r$\n'
  FileWrite $0 ')$\r$\n'
  FileWrite $0 '$\r$\n'
  FileWrite $0 ':: Iniciar servidor$\r$\n'
  FileWrite $0 'echo Iniciando servidor en puerto 3001...$\r$\n'
  FileWrite $0 'echo.$\r$\n'
  FileWrite $0 'echo URL: http://localhost:3001$\r$\n'
  FileWrite $0 'echo.$\r$\n'
  FileWrite $0 'node app.js$\r$\n'
  FileWrite $0 'pause$\r$\n'
  FileClose $0
  
  ; Icono
  File "resources\icon.ico"
  
  ; Documentación básica
  FileOpen $0 "$INSTDIR\README.txt" w
  FileWrite $0 'SISTEMA UPTAMCA v2.0.0$\r$\n'
  FileWrite $0 '=============================$\r$\n$\r$\n'
  FileWrite $0 'Instalado en: $INSTDIR$\r$\n'
  FileWrite $0 'Fecha: [DATE]$\r$\n$\r$\n'
  FileWrite $0 'Para iniciar el sistema:$\r$\n'
  FileWrite $0 '1. Haga doble clic en "iniciar.bat"$\r$\n'
  FileWrite $0 '2. O use el acceso directo del escritorio$\r$\n$\r$\n'
  FileWrite $0 'El sistema se abrirá en: http://localhost:3001$\r$\n'
  FileClose $0
  
  ; Archivo de configuración por defecto
  FileOpen $0 "$INSTDIR\config\config.json" w
  FileWrite $0 '{$\r$\n'
  FileWrite $0 '  "app": "Sistema UPTAMCA",$\r$\n'
  FileWrite $0 '  "version": "2.0.0",$\r$\n'
  FileWrite $0 '  "port": 3001,$\r$\n'
  FileWrite $0 '  "database": "$INSTDIR\\\\database\\\\uptamca.db",$\r$\n'
  FileWrite $0 '  "logFile": "$INSTDIR\\\\logs\\\\app.log",$\r$\n'
  FileWrite $0 '  "backupDir": "$INSTDIR\\\\backups"$\r$\n'
  FileWrite $0 '}$\r$\n'
  FileClose $0

  DetailPrint "Instalación principal completada."
SectionEnd

; ============================================
; SECCIÓN: ACCESOS DIRECTOS
; ============================================
Section "Accesos Directos" SecShortcuts
  DetailPrint "Creando accesos directos..."
  
  ; Crear carpeta en menú inicio
  CreateDirectory "$SMPROGRAMS\$StartMenuFolder"
  
  ; Acceso directo principal
  CreateShortCut "$SMPROGRAMS\$StartMenuFolder\Iniciar Sistema UPTAMCA.lnk" "$INSTDIR\iniciar.bat" "" "$INSTDIR\icon.ico" 0
  
  ; Acceso directo a carpeta
  CreateShortCut "$SMPROGRAMS\$StartMenuFolder\Abrir Carpeta de Instalación.lnk" "$INSTDIR"
  
  ; Acceso directo a documentación
  CreateShortCut "$SMPROGRAMS\$StartMenuFolder\Leer Documentación.lnk" "$INSTDIR\README.txt"
  
  ; Acceso directo a desinstalar
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateShortCut "$SMPROGRAMS\$StartMenuFolder\Desinstalar Sistema.lnk" "$INSTDIR\Uninstall.exe"
  
  ; Acceso directo en escritorio (opcional)
  CreateShortCut "$DESKTOP\Sistema UPTAMCA.lnk" "$INSTDIR\iniciar.bat" "" "$INSTDIR\icon.ico" 0
  
  ; URL del sitio web
  WriteINIStr "$SMPROGRAMS\$StartMenuFolder\Sitio Web UPTAMCA.url" "InternetShortcut" "URL" "https://www.uptamca.edu.ve"
  
  DetailPrint "Accesos directos creados."
SectionEnd

; ============================================
; SECCIÓN: VARIABLES DE ENTORNO
; ============================================
Section "Variables de Entorno" SecEnvVars
  DetailPrint "Configurando variables de entorno..."
  
  ; Crear variable UPTAMCA_HOME
  WriteRegExpandStr HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "UPTAMCA_HOME" "$INSTDIR"
  
  ; Agregar al PATH (opcional)
  ; EnvVar::AddValue "PATH" "$INSTDIR"
  
  ; Forzar actualización de variables
  SendMessage ${HWND_BROADCAST} ${WM_WININICHANGE} 0 "STR:Environment" /TIMEOUT=5000
  
  DetailPrint "Variables de entorno configuradas."
SectionEnd

; ============================================
; SECCIÓN: REGISTRO DE WINDOWS
; ============================================

Section -Post
  ; Registrar en Panel de Control -> Programas y Características
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SistemaUPTAMCA" \
    "DisplayName" "Sistema UPTAMCA"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SistemaUPTAMCA" \
    "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SistemaUPTAMCA" \
    "DisplayIcon" "$INSTDIR\icon.ico"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SistemaUPTAMCA" \
    "DisplayVersion" "2.0.0"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SistemaUPTAMCA" \
    "Publisher" "Universidad Politécnica Territorial de los Altos Mirandinos Cecilio Acosta"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SistemaUPTAMCA" \
    "HelpLink" "https://www.uptamca.edu.ve"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SistemaUPTAMCA" \
    "URLUpdateInfo" "https://www.uptamca.edu.ve/actualizaciones"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SistemaUPTAMCA" \
    "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SistemaUPTAMCA" \
    "Comments" "Sistema de gestión académica UPTAMCA"
  
  ; Tipo de instalación
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SistemaUPTAMCA" \
    "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SistemaUPTAMCA" \
    "NoRepair" 1
  
  ; Tamaño estimado
  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SistemaUPTAMCA" \
    "EstimatedSize" "$0"
  
  ; Registrar en nuestro propio registro
  WriteRegStr HKLM "Software\SistemaUPTAMCA" "InstallPath" "$INSTDIR"
  WriteRegStr HKLM "Software\SistemaUPTAMCA" "Version" "2.0.0"
  
  ; Obtener fecha actual
  ${GetTime} "" "L" $0 $1 $2 $3 $4 $5 $6
  WriteRegStr HKLM "Software\SistemaUPTAMCA" "InstallDate" "$2/$1/$0"
  
  DetailPrint "Registro de Windows actualizado."
  
  ; MENSAJE CORREGIDO - OPCIÓN 1 (una sola línea):
  MessageBox MB_OK|MB_ICONINFORMATION "¡Instalación completada exitosamente!$\r$\n$\r$\nEl Sistema UPTAMCA v2.0.0 ha sido instalado en:$\r$\n$INSTDIR$\r$\n$\r$\nPuede iniciarlo desde el acceso directo en el escritorio."
  
  ; OPCIÓN 2 (con continuaciones correctas):
  ; MessageBox MB_OK|MB_ICONINFORMATION \
  ;   "¡Instalación completada exitosamente!$\r$\n$\r$\n" + \
  ;   "El Sistema UPTAMCA v2.0.0 ha sido instalado en:$\r$\n" + \
  ;   "$INSTDIR$\r$\n$\r$\n" + \
  ;   "Puede iniciarlo desde el acceso directo en el escritorio."
SectionEnd

; ============================================
; DESCRIPCIONES DE LAS SECCIONES
; ============================================
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecMain} "Archivos esenciales del Sistema UPTAMCA (servidor, cliente, base de datos)."
  !insertmacro MUI_DESCRIPTION_TEXT ${SecShortcuts} "Crea accesos directos en el escritorio y menú inicio."
  !insertmacro MUI_DESCRIPTION_TEXT ${SecEnvVars} "Configura variables de entorno del sistema (UPTAMCA_HOME)."
!insertmacro MUI_FUNCTION_DESCRIPTION_END

; ============================================
; DESINSTALADOR
; ============================================
Section "Uninstall"
  ; PRIMER MessageBox 
  MessageBox MB_YESNO|MB_ICONQUESTION "¿Está seguro de desinstalar el Sistema UPTAMCA?$\r$\n$\r$\nLos datos de usuario (base de datos, backups, logs) se conservarán." IDNO endUninstall
  
  DetailPrint "Iniciando desinstalación..."
  
  ; ============================================
  ; 1. ELIMINAR ACCESOS DIRECTOS
  ; ============================================
  DetailPrint "Eliminando accesos directos..."
  Delete "$DESKTOP\Sistema UPTAMCA.lnk"
  Delete "$SMPROGRAMS\Sistema UPTAMCA\*.*"
  RMDir "$SMPROGRAMS\Sistema UPTAMCA"
  
  ; ============================================
  ; 2. ELIMINAR VARIABLES DE ENTORNO
  ; ============================================
  DetailPrint "Eliminando variables de entorno..."
  DeleteRegValue HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "UPTAMCA_HOME"
  
  ; ============================================
  ; 3. ELIMINAR REGISTRO DE WINDOWS
  ; ============================================
  DetailPrint "Eliminando registro..."
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SistemaUPTAMCA"
  DeleteRegKey HKLM "Software\SistemaUPTAMCA"
  
  ; ============================================
  ; 4. ELIMINAR ARCHIVOS DEL PROGRAMA
  ; ============================================
  DetailPrint "Eliminando archivos del programa..."
  Delete "$INSTDIR\iniciar.bat"
  Delete "$INSTDIR\README.txt"
  Delete "$INSTDIR\icon.ico"
  Delete "$INSTDIR\Uninstall.exe"
  
  ; Eliminar carpetas de programa
  RMDir /r "$INSTDIR\server"
  RMDir /r "$INSTDIR\client"
  RMDir /r "$INSTDIR\config"
  RMDir /r "$INSTDIR\Documentacion"
  
  ; ============================================
  ; 5. PREGUNTAR SOBRE DATOS DE USUARIO
  ; ============================================
  ; SEGUNDO MessageBox CORREGIDO
  MessageBox MB_YESNO|MB_ICONQUESTION "¿Desea eliminar TODOS los datos de usuario?$\r$\n$\r$\nEsto incluye:$\r$\n- Base de datos$\r$\n- Archivos de log$\r$\n- Backups$\r$\n$\r$\nEsta acción NO se puede deshacer." IDNO keepData
  
  ; Eliminar datos si el usuario confirma
  DetailPrint "Eliminando datos de usuario..."
  RMDir /r "$INSTDIR\database"
  RMDir /r "$INSTDIR\logs"
  RMDir /r "$INSTDIR\backups"
  Goto removeFolder
  
  keepData:
  DetailPrint "Conservando datos de usuario..."
  
  removeFolder:
  ; Verificar si la carpeta está vacía
  ${GetSize} "$INSTDIR" "/S=0K /G=0" $0 $1 $2
  ${If} $0 == 0
    RMDir "$INSTDIR"
  ${EndIf}
  
  ; Notificar al sistema
  SendMessage ${HWND_BROADCAST} ${WM_WININICHANGE} 0 "STR:Environment" /TIMEOUT=5000
  
  DetailPrint "Desinstalación completada."
  
  ; TERCER MessageBox CORREGIDO
  MessageBox MB_OK|MB_ICONINFORMATION "Sistema UPTAMCA ha sido desinstalado."
  
  endUninstall:
SectionEnd
; ============================================
; FUNCIÓN: .onInstSuccess
; ============================================
Function .onInstSuccess
  WriteRegStr HKCU "Software\SistemaUPTAMCA" "FirstRun" "1"
FunctionEnd

BrandingText "Sistema UPTAMCA v2.0.0 | Universidad Politécnica Cecilio Acosta"