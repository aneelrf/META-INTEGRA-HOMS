# Consultorio de Dolor

Aplicacion web para gestion de un consultorio de terapia del dolor.

## Estado

La aplicacion funciona como frontend puro con Firebase:

- Frontend: React, Vite y Tailwind CSS.
- Base de datos externa: Firestore.
- Autenticacion: Firebase Auth.

El objetivo es publicar en GitHub Pages con React hablando directamente con Firebase.

## Desarrollo Local

```bash
npm install
npm run dev
```

Servicio local:

- Frontend: `http://localhost:5173`

## Refactor

Principios para el trabajo:

- Un archivo, una responsabilidad.
- Separar paginas, componentes, hooks, servicios de datos y utilidades.
- Usar servicios de Firestore por feature.
- No versionar builds, `node_modules` ni archivos de entorno reales.

## Variables de Entorno

Usar `.env.example` como plantilla. Los archivos `.env` reales no se versionan.

## Deploy a GitHub Pages

El workflow vive en `.github/workflows/deploy-pages.yml` y se ejecuta en cada push a `main`.

Requisitos:

- Activar GitHub Pages en el repositorio usando **GitHub Actions** como source.
- Definir variables `VITE_...` en tiempo de build si no van versionadas.

Build local de Pages (opcional):

```bash
npm run build:pages
```
