# Análisis de Estructura de Archivos - Vehicle Manager

## Resumen General

Este análisis corresponde al contenido extraído del archivo `vehicle-manager - Copy - Copy.7z` descargado desde Google Drive. El archivo contiene una aplicación de gestión de vehículos desarrollada en Python con interfaz gráfica usando CustomTkinter y conexión a base de datos MySQL.

**Totales:**
- **Archivos:** 11 archivos
- **Directorios:** 3 directorios (incluyendo el directorio raíz)

## Estructura de Directorios

```
.
├── vehicle-manager - Copy - Copy
│   ├── VM_VERTEX.spec
│   ├── api_handler.py
│   ├── camera_scanner.py
│   ├── config.ini
│   ├── db_config.json
│   ├── db_manager.py
│   ├── languages
│   │   └── es.json
│   ├── main_app.py
│   ├── main_app.spec
│   └── requirements.txt
└── vehicle-manager - Copy - Copy.7z

2 directories, 11 files
```

## Distribución por Tipo de Archivo

- **Python (.py):** 4 archivos - Código fuente principal de la aplicación
- **Spec (.spec):** 2 archivos - Archivos de configuración para PyInstaller
- **JSON (.json):** 2 archivos - Configuración de base de datos y traducciones
- **Texto (.txt):** 1 archivo - Lista de dependencias de Python
- **Configuración (.ini):** 1 archivo - Configuración de base de datos
- **Comprimido (.7z):** 1 archivo - Archivo original comprimido

## Análisis de Componentes Principales

### 1. Archivos de Código Python

#### **main_app.py** (Aplicación Principal)
- Interfaz gráfica desarrollada con CustomTkinter
- Importa módulos para gestión de base de datos y API
- Incluye funcionalidades de calendario (tkcalendar)
- Manejo de hilos para tareas en segundo plano
- Sistema de importación con manejo de errores

#### **api_handler.py** (Manejador de API)
- Integración con la API de NHTSA (National Highway Traffic Safety Administration)
- Función para obtener información de vehículos mediante VIN
- URL base: `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/`

#### **db_manager.py** (Gestor de Base de Datos)
- Manejo de conexiones a base de datos MySQL
- Gestión de errores de base de datos

#### **camera_scanner.py** (Escáner de Cámara)
- Funcionalidad de escaneo (probablemente para códigos QR/códigos de barras)
- Utiliza OpenCV y pyzbar según las dependencias

### 2. Archivos de Configuración

#### **config.ini** y **db_config.json**
- Configuración de base de datos MySQL
- Host: localhost
- Base de datos: `taller_db`
- Usuario: `taller_user`
- Puerto: 3306

### 3. Dependencias (requirements.txt)
- `mysql-connector-python` - Conexión a MySQL
- `requests` - Peticiones HTTP para API
- `opencv-python` - Procesamiento de imágenes/video
- `pyzbar` - Lectura de códigos de barras/QR
- `ttkthemes` - Temas para Tkinter
- `Pillow` - Manipulación de imágenes

### 4. Internacionalización
- **languages/es.json** - Traducciones al español
- Incluye etiquetas para interfaz de usuario como "Gestor de Taller", "Vehículos", "Calendario", etc.

### 5. Archivos de Distribución
- **VM_VERTEX.spec** y **main_app.spec** - Configuraciones para crear ejecutables con PyInstaller

## Características Técnicas Identificadas

1. **Arquitectura:** Aplicación de escritorio con interfaz gráfica moderna
2. **Base de Datos:** MySQL para persistencia de datos
3. **API Externa:** Integración con NHTSA para información de vehículos
4. **Funcionalidades:**
   - Gestión de vehículos
   - Sistema de calendario
   - Escaneo de códigos (VIN, códigos de barras)
   - Configuración multiidioma
   - Interfaz de usuario moderna con CustomTkinter

## Recomendaciones para PWA

Para convertir esta aplicación de escritorio en una PWA (Progressive Web App), se recomienda:

1. **Backend:** Migrar la lógica de `db_manager.py` y `api_handler.py` a un servidor web (Flask/FastAPI)
2. **Frontend:** Reemplazar CustomTkinter con tecnologías web (React, Vue.js, o vanilla JavaScript)
3. **Base de Datos:** Mantener MySQL pero exponer a través de API REST
4. **Cámara:** Utilizar Web APIs para acceso a cámara del dispositivo
5. **Offline:** Implementar Service Workers para funcionalidad offline
6. **Responsive:** Adaptar la interfaz para dispositivos móviles y tablets

## Ubicación de Archivos

Todos los archivos extraídos se encuentran en: `/home/ubuntu/original_files/vehicle-manager - Copy - Copy/`
