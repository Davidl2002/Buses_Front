# Guía de inicio

Esta guía cubre cómo levantar el proyecto y la documentación en tu máquina local.

## Requisitos

- Node.js 18+ (recomendado)
- npm o pnpm

## Instalar dependencias

En la raíz del proyecto ejecuta:

```powershell
npm install
```

> Nota: agregué `vitepress` a `devDependencies`. Si ya tienes instalado npm, el comando anterior instalará las dependencias necesarias.

## Ejecutar la aplicación (frontend)

```powershell
npm run dev
```

La app se sirve por defecto con Vite en `http://localhost:5173` (o el puerto que Vite asigne).

## Ejecutar la documentación localmente

```powershell
npm run docs:dev
```

Esto levantará VitePress y podrás ver la documentación en `http://localhost:5173` (o el puerto que indique la consola). Si la app del frontend y la docs usan el mismo puerto, cierra la app o usa el puerto alternativo que Vite indique.

## Construir la documentación para producción

```powershell
npm run docs:build
```

Luego puedes usar `npm run docs:serve` para previsualizar los archivos estáticos generados.
