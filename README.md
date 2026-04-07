# META Integra - Cuestionario Clínico y Dashboard Médico

Este proyecto es una plataforma interactiva y multilingüe diseñada para el **Instituto Bariátrico y Digestivo (Dr. Héctor Sánchez N.)**. Automatiza el ingreso de datos médicos de los pacientes a través de un cuestionario dinámico, y proporciona un panel de administración en tiempo real ("Doctor Dashboard") para la consulta clínica.

## 🌟 Características Principales

### 1. Flujo del Paciente (Cuestionario Inteligente)
- **Multilingüe**: Soporte integrado para Español, Inglés, Francés y Alemán. Cambia la UI, las preguntas y el sistema lógico de condiciones instantáneamente sin necesidad de recargar.
- **Lógica Condicional (Branching)**: Las preguntas reaccionan a las respuestas. Si un paciente dice "Sí" a condiciones médicas o selecciona una opción de "Otro", el flujo automáticamente inyecta una pantalla para "Especificar detalles".
- **Diseño Premium**: Interfaz moderna, minimalista y estética en tonos Azul Marino y tipografía _Calibri_, complementada con animaciones sutiles entre pantallas brindadas por `framer-motion`.

### 2. Doctor Dashboard (Panel Médico Protegido)
- **Autenticación Segura**: Rutas resguardadas mediante `Firebase Auth` para garantizar que la información de salud esté estrictamente limitada al personal autorizado.
- **Panel Estético**: Visualización clara de todos los pacientes, con opciones para filtrar por nombre o fecha de registro.
- **Generación de Resumen**: Un solo click genera y copia automáticamente un resumen formateado de todos los datos clínicos del paciente al portapapeles.
- **Cálculo Automático IMC**: El panel identifica el peso y la estatura introducidos (independientemente si es en kg/lb o m/ft), y calcula el Índice de Masa Corporal automáticamente en el resumen.

## 🛠 Herramientas y Tecnologías Utilizadas

- **Core React**: `React 19` con `TypeScript` bajo la poderosa y velocísima compilación de **Vite**.
- **Enrutamiento**: `react-router-dom` para manejar de manera unificada la página principal (`/`) y el panel protegido (`/doctor`).
- **Base de Datos & Auth**: **Firebase** (`Firebase Firestore` para almacenar la metadata de los pacientes de forma segura y veloz, y `Firebase Auth` para proteger el panel de administración).
- **Estilos**: **Tailwind CSS v4** gestionando las paletas institucionales, bordes suaves y el sistema de diseño general del sitio. Se definió globalmente un estilo tipográfico `sans` anidado a _Calibri_.
- **Iconografía**: `lucide-react` para iconos minimalistas de alta resolución.
- **Animaciones**: `framer-motion` para otorgar transiciones elegantes al cuestionario entre cada respuesta.
- **Despliegue (Hosting)**: Automatizado a través del paquete `gh-pages` directo a los servidores públicos de GitHub Pages.

## 📂 Estructura del Proyecto

```text
src/
├── assets/                  # Recursos estáticos locales
├── components/           
│   ├── Doctor/              # Vistas Administrativas y Autenticación (DoctorLogin, DoctorDashboard)
│   └── PatientFlow/         # Lógica Multilingüe del formulario y QuestionScreens
├── config/                  
│   ├── i18n.ts              # Reglas de Internacionalización y Diccionario de Idiomas
│   └── questions.ts         # Arquitectura del Cuestionario clínico, lógicas y condiciones.
├── store/                   # React Context (PatientContext) que suscribe los cambios en Firebase
├── App.tsx                  # Componente Raíz que maneja React Router
├── firebase.ts              # Configuración e inicialización de Firebase App, Auth y Firestore
├── index.css                # Configuración de los Tokens y Temas Core de Tailwind V4
└── main.tsx                 # Entry point
```

## 🚀 Instalación y Desarrollo Local

1. Instalar las dependencias de Node:
   ```bash
   npm install
   ```
2. Ejecutar el servidor de desarrollo local de Vite:
   ```bash
   npm run dev
   ```
3. La aplicación estará corriendo visible en `http://localhost:5173/META-INTEGRA-HOMS/`. Se puede probar el cuestionario abiertamente, pero la ruta `/doctor` solicitará inicio de sesión mediante credenciales de Firebase.

## 📦 Despliegue a Producción

La plataforma se despliega con un comando sencillo que compila la versión altamente optimizada de React y la promueve a GitHub Pages.

```bash
npm run deploy
```

> **Nota:** Cada vez que realices `npm run deploy`, los cambios serán compilados en el fólder `/dist` y subidos a la rama `gh-pages` para actualizar la URL de producción públicamente.
