# Estados Financieros

Monorepo para una plataforma de control financiero con:

- Dashboard principal con ventas por día, gastos por día y saldo en banco.
- Módulo de banco.
- Proveedores y gastos con carga de facturas.
- Ventas con lectura de facturas.
- Contabilidad con filtros por día, semana y mes.
- Panel de IA para resumen de rentabilidad.

## Estructura

- `frontend`: aplicación web para desplegar en Vercel.
- `backend`: API para desplegar en Railway.

## Estado actual

Se dejó una base MVP con navegación por páginas, lectura de facturas por texto OCR y una API lista para conectar persistencia, OCR real e IA.

## Arranque local

1. Instala dependencias en la raíz con `npm install`.
2. Ejecuta `npm run dev` para levantar frontend y backend en paralelo.
3. Si quieres iniciar solo la API usa `npm run dev:backend`.

## Despliegue

- Frontend: conecta la carpeta `frontend` a Vercel.
- Backend: conecta la carpeta `backend` a Railway.
- Variable sugerida para frontend: `NEXT_PUBLIC_API_URL` apuntando al backend publicado.

## Pendientes naturales

- OCR real para imagen y PDF.
- Persistencia en base de datos.
- Conector de IA real para el analisis ejecutivo.
