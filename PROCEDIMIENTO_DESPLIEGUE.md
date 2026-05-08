# Guía de Despliegue: Antigravity -> GitHub -> Portainer (VPS)

Este documento describe el flujo de trabajo estandarizado para desarrollar, sincronizar y desplegar aplicaciones utilizando este ecosistema.

---

## 1. Desarrollo con Antigravity (Local)

Antigravity actúa como tu asistente de codificación y automatización. El flujo recomendado es:

1.  **Planificación**: Describe la funcionalidad deseada. Antigravity creará un plan de implementación.
2.  **Desarrollo y Ajustes**: Antigravity modifica el código fuente (Frontend/Backend) basándose en tus requerimientos.
3.  **Pruebas Locales**:
    *   Compilar el frontend si es necesario (`npm run build`).
    *   Ejecutar el backend unificado para verificar que sirve tanto la API como los archivos estáticos.
    *   Usar el comando `node` para scripts de prueba rápidos (`scratch/test_logic.js`).

---

## 2. Sincronización y CI/CD con GitHub

Una vez que los cambios locales son satisfactorios, el siguiente paso es la automatización del empaquetado.

1.  **Sincronización de Git**:
    *   Comando: `git add .`, `git commit -m "descripción"`, `git push origin main`.
2.  **GitHub Actions (Build)**:
    *   Al hacer push, el archivo `.github/workflows/docker-publish.yml` se dispara.
    *   Este proceso construye la imagen de Docker (ej: `pmo-control-app`) y la sube al **GitHub Container Registry (GHCR)**.
    *   **Importante**: Monitorear la pestaña "Actions" en GitHub para asegurar que el check esté en verde antes de proceder al VPS.

---

## 3. Despliegue en el VPS (Portainer)

Portainer gestiona los contenedores en el servidor remoto (Docker Swarm).

1.  **Acceso a Portainer**: Entra en tu panel de administración (ej: puerto 9443).
2.  **Gestión de Stacks**:
    *   Localiza el Stack de tu proyecto.
    *   **Actualización (Redeploy)**: 
        *   Haz clic en el Stack y ve a la pestaña "Editor".
        *   Presiona el botón **"Update the stack"**.
        *   **CRÍTICO**: Activa la opción **"Pull latest image"**. Esto fuerza a Portainer a descargar la nueva versión de la imagen que acaba de crear GitHub Actions.
3.  **Verificación**: Revisa los logs del servicio en Portainer para confirmar que la base de datos se sincronizó correctamente y el servidor está escuchando en el puerto asignado (ej: 3001).

---

## 4. Consideraciones Técnicas y Tips

### Sincronización de Base de Datos
*   Para cambios en el modelo (añadir columnas), asegúrate de que `sequelize.sync({ alter: true })` esté habilitado temporalmente en `index.js`. Esto evita errores 500 por discrepancias de esquema.

### Variables de Entorno
*   Mantén el archivo `.env` fuera de Git.
*   En Portainer, define las variables necesarias (`DATABASE_URL`, `JWT_SECRET`, etc.) dentro de la configuración del Stack para que se inyecten en el contenedor.

### Arquitectura Unificada
*   Este proyecto utiliza una **arquitectura de contenedor único**: el backend (Express) sirve los archivos estáticos del frontend (Next.js exportado) desde la carpeta `public/`. Esto elimina problemas de CORS y simplifica el ruteo de red interna.

---

*Documentación generada por Antigravity para PMO-CONTROL - Mayo 2026*
