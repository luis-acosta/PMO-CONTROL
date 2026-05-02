# Guía de Despliegue en Portainer (Desde Repositorio GitHub)

Sigue este procedimiento paso a paso para desplegar **PMO-CONTROL** en tu VPS utilizando la integración nativa de Portainer con repositorios Git.

## Requisitos Previos

> **Paso Crítico: Hacer públicas las imágenes de GitHub (GHCR)**
> Por defecto, cuando GitHub Actions compila tus imágenes de un repositorio privado, las bloquea. Si no las haces públicas, Portainer arrojará un error de `Rejected` al intentar descargarlas.

1. Ve a tu cuenta de GitHub en el navegador web.
2. Haz clic en tu foto de perfil (arriba a la derecha) y selecciona **Your profile** (Tu perfil).
3. En las pestañas del medio, haz clic en **Packages** (Paquetes).
4. Haz clic en el paquete **`pmo-control-frontend`**.
5. En el menú derecho inferior, haz clic en **Package settings** (Configuración del paquete).
6. Baja hasta la "Danger Zone" y haz clic en **Change visibility**.
7. Cámbialo a **Public** y confirma escribiendo el nombre del paquete.
8. **Repite los pasos 4 al 7 para el paquete `pmo-control-backend`.**

---

## 🛠️ Procedimiento Paso a Paso en Portainer

### Paso 1: Ingresar a Stacks
1. Abre tu panel de **Portainer** en el navegador.
2. Selecciona tu **Environment** (usualmente se llama *primary* o *local*).
3. En el menú lateral izquierdo, haz clic en **Stacks**.

### Paso 2: Crear el Nuevo Stack
1. En la esquina superior derecha, haz clic en el botón azul **+ Add stack**.
2. En el campo **Name**, escribe un nombre para tu proyecto sin espacios. Por ejemplo: `pmo-control`

### Paso 3: Configurar el Origen (Repository)
1. En la sección *Build method* (Método de construcción), selecciona la opción **Repository** (la del ícono de Git).
2. Llenar los campos exactamente así:
   - **Repository URL**: `https://github.com/luis-acosta/PMO-CONTROL.git`
   - **Repository reference**: `refs/heads/main`
   - **Compose path**: `docker-compose.yml`

> **Autenticación del Repositorio**
> Si tu repositorio de código es Privado, activa la opción **Authentication**.
> En **Username** coloca `luis-acosta` (o tu correo).
> En **Password** debes usar tu **Personal Access Token (PAT)** de GitHub, **NO** tu contraseña normal. 

### Paso 4: Variables de Entorno
En la sección *Environment variables*, no necesitas agregar nada porque las credenciales de la Base de Datos ya están preconfiguradas en el archivo `docker-compose.yml`.

### Paso 5: Desplegar
1. Desplázate hasta el final de la página.
2. Haz clic en el botón azul **Deploy the stack**.

> **NOTA:** Portainer puede tardar de 1 a 3 minutos en esta pantalla descargando las imágenes. No actualices la página.

---

## 🌐 Verificación Post-Despliegue

Una vez que veas el Stack `pmo-control` en estado **Running**:

1. Ingresa a la sección **Containers** en el menú de Portainer.
2. Deberías ver los tres nuevos contenedores en verde (Running):
   - `pmo-control_db`
   - `pmo-control_backend`
   - `pmo-control_frontend`
3. Abre una nueva pestaña en tu navegador web y entra a **https://mto.pdiadvanced.cloud**. 

### Troubleshooting (Solución de errores comunes)
- **Error "Failure. Unable to clone git repository"**: Estás usando tu contraseña normal de GitHub. Debes generar un Personal Access Token (PAT) con permisos de `repo` en los ajustes de desarrollo de GitHub y pegarlo en el campo de Password.
- **Servicios se quedan en "Rejected" (Error de descarga de imagen)**: 
  Significa que Portainer no tiene permisos para descargar las imágenes. Tienes dos opciones para solucionarlo:
  
1. En GitHub, navegue hasta la página principal del repositorio.
2. Debajo del nombre del repositorio, haz clic en  Settings. Si no puedes ver la pestaña "Configuración", selecciona el menú desplegable  y, a continuación, haz clic en Configuración.
3.Captura de pantalla de un encabezado de repositorio en el que se muestran las pestañas. La pestaña "Configuración" está resaltada con un contorno naranja oscuro.
4.En la sección "Zona de peligro", a la derecha de "Cambiar la visibilidad del repositorio", haga clic en Cambiar visibilidad.
5.Selecciona una visibilidad.
6. Haga clic para confirmar que está cambiando la visibilidad del repositorio correcto.
7. Haga clic en He leído y entiendo estos efectos.
8. Haga clic en Hacer público este repositorio o haga que este repositorio sea privado.