; ============================================
; INSTALADOR SISTEMA UPTAMCA v1.0.0
; Version final - Solo start.exe maneja todo
; ============================================

Unicode true
Name "Sistema UPTAMCA"
Caption "Instalador Sistema UPTAMCA v1.0.0"
OutFile "..\dist\Instalar_UPTAMCA.exe"
InstallDir "$PROGRAMFILES\SistemaUPTAMCA"
InstallDirRegKey HKLM "Software\SistemaUPTAMCA" "InstallPath"
RequestExecutionLevel admin
ShowInstDetails show
ShowUninstDetails show

; ============================================
; ICONOS Y BANNERS
; ============================================
!define MUI_ICON "resources\icon.ico"
!define MUI_UNICON "resources\icon.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "resources\banner.bmp"
!define MUI_HEADERIMAGE_RIGHT
!define MUI_WELCOMEFINISHPAGE_BITMAP "resources\banner.bmp"
!define MUI_WELCOMEPAGE_TITLE "Bienvenido al Sistema UPTAMCA v1.0.0"
!define MUI_WELCOMEPAGE_TEXT "Este asistente instalara el Sistema UPTAMCA v1.0.0 en su computadora.$\r$\n$\r$\nRequisitos minimos:$\r$\n* Windows 7 o superior$\r$\n* 2 GB de RAM$\r$\n* 500 MB espacio libre$\r$\n* Node.js 14+ (para el servidor)$\r$\n$\r$\nRecomendamos cerrar todas las aplicaciones antes de continuar."

; ============================================
; INCLUIR MoDULOS
; ============================================
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "FileFunc.nsh"
!include "x64.nsh"
!include "WinVer.nsh"

; ============================================
; PaGINAS DEL INSTALADOR
; ============================================
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "..\LICENSE"
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES

; Configurar pagina final
!define MUI_FINISHPAGE_TITLE "Instalacion Completada"
!define MUI_FINISHPAGE_TEXT "El Sistema UPTAMCA v1.0.0 ha sido instalado exitosamente.$\r$\n$\r$\nEl sistema incluye:$\r$\n* Interfaz grafica principal (start.exe)$\r$\n* Servidor Node.js$\r$\n* Interfaz web React$\r$\n* Base de datos local"
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_TEXT "Iniciar Sistema UPTAMCA ahora"
!define MUI_FINISHPAGE_RUN_FUNCTION "LaunchApp"
!define MUI_FINISHPAGE_SHOWREADME "$INSTDIR\README.txt"
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Ver documentacion del sistema"
!define MUI_FINISHPAGE_NOREBOOTSUPPORT
!insertmacro MUI_PAGE_FINISH

; Paginas del desinstalador
!insertmacro MUI_UNPAGE_WELCOME
!define MUI_UNCONFIRMPAGE_TEXT_TOP "El sistema sera eliminado de su computadora. Los datos de usuario se conservaran a menos que especifique lo contrario."
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

; Funcion para iniciar la aplicacion
Function LaunchApp
  SetOutPath "$INSTDIR"
  ; Ejecutar directamente start.exe
  Exec '"$INSTDIR\start.exe"'
FunctionEnd

; Funcion para verificar Node.js
Function CheckNodeJS
  nsExec::ExecToStack 'node --version'
  Pop $0
  Pop $1
  ${If} $0 != 0
    MessageBox MB_YESNO|MB_ICONQUESTION "Node.js no esta instalado o no esta en el PATH.$\r$\n$\r$\nEl servidor requiere Node.js para funcionar.$\r$\n¿Desea continuar de todos modos?" IDYES continueInstall IDNO abortInstall
    
    abortInstall:
      Quit
      
    continueInstall:
      MessageBox MB_OK|MB_ICONEXCLAMATION "El sistema se instalara pero el servidor no funcionara hasta que instale Node.js.$\r$\n$\r$\nPuede instalar Node.js desde: https://nodejs.org/"
  ${EndIf}
FunctionEnd

; Verificar requisitos del sistema
Function .onInit
  StrCpy $AppName "Sistema UPTAMCA"
  StrCpy $AppVersion "1.0.0"
  
  ; Verificar Windows 7 o superior
  ${IfNot} ${AtLeastWin7}
    MessageBox MB_OK|MB_ICONSTOP "Este sistema requiere Windows 7 o superior."
    Quit
  ${EndIf}
  
  ; Verificar arquitectura
  ${If} ${RunningX64}
    SetRegView 64
    StrCpy $INSTDIR "$PROGRAMFILES64\SistemaUPTAMCA"
  ${Else}
    MessageBox MB_OK|MB_ICONEXCLAMATION "Se recomienda usar Windows de 64 bits para mejor rendimiento."
  ${EndIf}
  
  ; Inicializar carpeta del menu inicio
  StrCpy $StartMenuFolder "Sistema UPTAMCA"
  
  ; Verificar Node.js
  Call CheckNodeJS
  
  ; Verificar instalacion anterior
  ReadRegStr $0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SistemaUPTAMCA" "UninstallString"
  ${If} $0 != ""
    MessageBox MB_YESNO|MB_ICONQUESTION \
      "Se encontro una instalacion previa de UPTAMCA. $\n$\n¿Desea desinstalarla antes de continuar?" \
      IDYES uninstallOld IDNO skipUninstall
      
    uninstallOld:
      ExecWait '$0 _?=$INSTDIR'
      Delete "$0"
      DetailPrint "Instalacion anterior desinstalada."
      
    skipUninstall:
  ${EndIf}
FunctionEnd

; ============================================
; SECCIoN PRINCIPAL (Siempre instalada)
; ============================================
Section "!Aplicacion Principal" SecMain
  SectionIn RO
  
  SetOutPath "$INSTDIR"
  
  ; Mensaje de inicio
  DetailPrint "Instalando Sistema UPTAMCA v1.0.0..."
  
  ; ============================================
  ; 1. CREAR ESTRUCTURA DE CARPETAS
  ; ============================================
  DetailPrint "Creando estructura de carpetas..."
  CreateDirectory "$INSTDIR"
  CreateDirectory "$INSTDIR\server"
  CreateDirectory "$INSTDIR\client"
  CreateDirectory "$INSTDIR\config"
  
  ; ============================================
  ; 2. COPIAR EJECUTABLE PRINCIPAL (start.exe)
  ; ============================================
  DetailPrint "Copiando ejecutable principal..."
  SetOutPath "$INSTDIR"
  
  ; ¡IMPORTANTE! Verificar primero si start.exe esta disponible
  ; Estos archivos deben estar en la MISMA CARPETA donde esta este script
  
  ; start.exe esta en la misma carpeta que el script
  File "..\src\start.exe"
  DetailPrint "✓ start.exe copiado"
  
  ; ============================================
  ; 3. COPIAR ARCHIVOS DEL SERVIDOR
  ; ============================================
  DetailPrint "Copiando archivos del servidor..."
  SetOutPath "$INSTDIR\server"
  
  File /r "..\src\server\*.*"
  DetailPrint "✓ Servidor copiado"
  
  ; ============================================
  ; 4. COPIAR CLIENTE WEB
  ; ============================================
  DetailPrint "Copiando interfaz web..."
  SetOutPath "$INSTDIR\client\dist"

  ; Si los archivos del cliente estan en src\client\dist
  File /r "..\src\client\dist\*.*"
  DetailPrint "✓ Cliente web copiado"
  
  ; ============================================
  ; 5. COPIAR ARCHIVOS ADICIONALES
  ; ============================================
  DetailPrint "Copiando archivos adicionales..."
  SetOutPath "$INSTDIR"
  
  ; Icono
  File "resources\icon.ico"
  DetailPrint "✓ Icono copiado"
  
  ; Documentacion
  File "..\README.md"
  Rename "$INSTDIR\README.md" "$INSTDIR\README.txt"
  DetailPrint "✓ Documentacion copiada"
  
  ; Licencia
  File "..\LICENSE"
  DetailPrint "✓ Licencia copiada"
  
  DetailPrint "Instalacion principal completada."
SectionEnd

; ============================================
; SECCIoN: ACCESOS DIRECTOS
; ============================================
Section "Accesos Directos" SecShortcuts
  DetailPrint "Creando accesos directos..."
  
  ; Crear carpeta en menu inicio
  CreateDirectory "$SMPROGRAMS\$StartMenuFolder"
  
  ; Acceso directo PRINCIPAL (ejecuta start.exe)
  ${If} ${FileExists} "$INSTDIR\icon.ico"
    CreateShortCut "$SMPROGRAMS\$StartMenuFolder\Iniciar Sistema UPTAMCA.lnk" "$INSTDIR\start.exe" "" "$INSTDIR\icon.ico" 0
    CreateShortCut "$DESKTOP\Sistema UPTAMCA.lnk" "$INSTDIR\start.exe" "" "$INSTDIR\icon.ico" 0
  ${Else}
    CreateShortCut "$SMPROGRAMS\$StartMenuFolder\Iniciar Sistema UPTAMCA.lnk" "$INSTDIR\start.exe"
    CreateShortCut "$DESKTOP\Sistema UPTAMCA.lnk" "$INSTDIR\start.exe"
  ${EndIf}
  
  ; Acceso directo a carpeta de instalacion
  CreateShortCut "$SMPROGRAMS\$StartMenuFolder\Abrir Carpeta de Instalacion.lnk" "$INSTDIR"
  
  ; Acceso directo a documentacion
  ${If} ${FileExists} "$INSTDIR\README.txt"
    CreateShortCut "$SMPROGRAMS\$StartMenuFolder\Leer Documentacion.lnk" "$INSTDIR\README.txt"
  ${EndIf}
  
  ; URL del sitio web
  WriteINIStr "$SMPROGRAMS\$StartMenuFolder\Sitio Web UPTAMCA.url" "InternetShortcut" "URL" "https://www.uptamca.edu.ve"
  
  DetailPrint "Accesos directos creados."
SectionEnd

; ============================================
; SECCIoN: REGISTRO DE WINDOWS
; ============================================
Section -Post
  DetailPrint "Actualizando registro de Windows..."
  
  ; Registrar en Panel de Control -> Programas y Caracteristicas
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SistemaUPTAMCA" \
    "DisplayName" "Sistema UPTAMCA"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SistemaUPTAMCA" \
    "UninstallString" '"$INSTDIR\Uninstall.exe"'
  ${If} ${FileExists} "$INSTDIR\icon.ico"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SistemaUPTAMCA" \
      "DisplayIcon" "$INSTDIR\icon.ico"
  ${EndIf}
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SistemaUPTAMCA" \
    "DisplayVersion" "1.0.0"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SistemaUPTAMCA" \
    "Publisher" "Universidad Politecnica Territorial de los Altos Mirandinos Cecilio Acosta"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SistemaUPTAMCA" \
    "HelpLink" "https://www.uptamca.edu.ve"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SistemaUPTAMCA" \
    "URLUpdateInfo" "https://www.uptamca.edu.ve/actualizaciones"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SistemaUPTAMCA" \
    "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SistemaUPTAMCA" \
    "Comments" "Sistema de gestion academica UPTAMCA"
  
  ; Tipo de instalacion
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
  WriteRegStr HKLM "Software\SistemaUPTAMCA" "Version" "1.0.0"
  WriteRegStr HKLM "Software\SistemaUPTAMCA" "InstallDate" "$GetTime"
  
  ; Crear desinstalador
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  
  DetailPrint "Registro de Windows actualizado."
  
  ; Mensaje final
  MessageBox MB_OK|MB_ICONINFORMATION \
    "¡Instalacion completada exitosamente!$\r$\n$\r$\nEl Sistema UPTAMCA v1.0.0 ha sido instalado en:$\r$\n$INSTDIR$\r$\n$\r$\nPuede iniciarlo desde:$\r$\n* El acceso directo en el escritorio$\r$\n* El menu Inicio$\r$\n* Ejecutando start.exe directamente"
SectionEnd

; ============================================
; DESCRIPCIONES DE LAS SECCIONES
; ============================================
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecMain} "Archivos esenciales del Sistema UPTAMCA: ejecutable principal, servidor, cliente web y configuracion."
  !insertmacro MUI_DESCRIPTION_TEXT ${SecShortcuts} "Crea accesos directos en el escritorio y menu inicio."
!insertmacro MUI_FUNCTION_DESCRIPTION_END

; ============================================
; DESINSTALADOR
; ============================================
Section "Uninstall"
  ; PRIMER MessageBox
  MessageBox MB_YESNO|MB_ICONQUESTION "¿Esta seguro de desinstalar el Sistema UPTAMCA?$\r$\n$\r$\nLos datos de usuario (base de datos, backups, logs) se conservaran." IDNO endUninstall
  
  DetailPrint "Iniciando desinstalacion..."
  
  ; ============================================
  ; 1. ELIMINAR ACCESOS DIRECTOS
  ; ============================================
  DetailPrint "Eliminando accesos directos..."
  Delete "$DESKTOP\Sistema UPTAMCA.lnk"
  Delete "$SMPROGRAMS\$StartMenuFolder\*.*"
  Delete "$SMPROGRAMS\$StartMenuFolder\Sitio Web UPTAMCA.url"
  RMDir "$SMPROGRAMS\$StartMenuFolder"
  
  ; ============================================
  ; 2. ELIMINAR REGISTRO DE WINDOWS
  ; ============================================
  DetailPrint "Eliminando registro..."
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SistemaUPTAMCA"
  DeleteRegKey HKLM "Software\SistemaUPTAMCA"
  
  ; ============================================
  ; 3. ELIMINAR ARCHIVOS DEL PROGRAMA
  ; ============================================
  DetailPrint "Eliminando archivos del programa..."
  Delete "$INSTDIR\start.exe"
  Delete "$INSTDIR\icon.ico"
  Delete "$INSTDIR\README.txt"
  Delete "$INSTDIR\LICENSE"
  Delete "$INSTDIR\Uninstall.exe"
  
  ; Eliminar solo las carpetas principales
  RMDir /r "$INSTDIR\server"
  RMDir /r "$INSTDIR\client"
  RMDir /r "$INSTDIR\config"
  
  ; ============================================
  ; 4. PREGUNTAR SOBRE CARPETAS ADICIONALES
  ; ============================================
  MessageBox MB_YESNO|MB_ICONQUESTION "¿Desea eliminar TODAS las carpetas adicionales?$\r$\n$\r$\nEsto incluye:$\r$\n* Base de datos (database)$\r$\n* Logs$\r$\n* Backups$\r$\n$\r$\nEsta accion NO se puede deshacer." IDNO keepData
  
  ; Eliminar datos si el usuario confirma
  DetailPrint "Eliminando datos de usuario..."
  RMDir /r "$INSTDIR\database"
  RMDir /r "$INSTDIR\logs"
  RMDir /r "$INSTDIR\backups"
  Goto removeFolder
  
  keepData:
  DetailPrint "Conservando datos de usuario..."
  
  removeFolder:
  ; Verificar si la carpeta esta vacia antes de eliminarla
  FindFirst $0 $1 "$INSTDIR\*"
  loop:
    StrCmp $1 "" done
    StrCmp $1 "." next
    StrCmp $1 ".." next
    Goto notEmpty
  next:
    FindNext $0 $1
    Goto loop
  
  notEmpty:
    FindClose $0
    Goto endCleanup
  
  done:
    FindClose $0
    RMDir "$INSTDIR"
  
  endCleanup:
  DetailPrint "Desinstalacion completada."
  
  ; Mensaje final
  MessageBox MB_OK|MB_ICONINFORMATION "Sistema UPTAMCA ha sido desinstalado."
  
  endUninstall:
SectionEnd

; ============================================
; FUNCIoN: .onInstSuccess
; ============================================
Function .onInstSuccess
  WriteRegStr HKCU "Software\SistemaUPTAMCA" "FirstRun" "1"
FunctionEnd

BrandingText "Sistema UPTAMCA v1.0.0 | Universidad Politecnica Territorial de los Altos Mirandinos Cecilio Acosta"