# Ecomeq — Plataforma de Gestión Ambiental ♻️

Ecomeq es una aplicación web orientada a apoyar la gestión ambiental industrial, con énfasis en el seguimiento de residuos peligrosos (RESPEL), las inspecciones, los incidentes y la formación del personal.

Este proyecto busca centralizar información operativa y facilitar el seguimiento mediante paneles, formularios y reportes.

## ✨ Funcionalidades

Según la implementación actual, la plataforma incluye módulos para:

- **Panel de control y analítica:** indicadores y resúmenes de la información registrada.
- **Gestión de RESPEL:** registro y consulta de recolecciones, tipos de residuos, áreas y pesos.
- **Inspecciones:** listas de verificación, hallazgos y seguimiento.
- **Incidentes:** registro y consulta de incidentes.
- **Capacitaciones:** catálogo de cursos, evaluaciones y seguimiento de formación.
- **Fichas de datos de seguridad (FDS/SDS):** biblioteca y gestión de fichas.
- **Gestión de recursos:** seguimiento de consumos y lecturas.
- **Calendario y notificaciones:** apoyo a la programación y seguimiento de actividades.
- **Reportes y exportación:** generación de reportes y exportación de información a CSV; algunas vistas permiten imprimir documentos.
- **Usuarios y roles:** interfaz con perfiles como Coordinador y Jefe de Área.

> **Estado del proyecto:** prototipo web en desarrollo. Antes de usarlo en producción, es necesario validar el almacenamiento, la autenticación, los permisos y la protección de datos.

## 🧰 Tecnologías

- HTML5
- CSS3
- JavaScript
- `http-server` para servir la aplicación localmente
- `localStorage` del navegador para persistencia local en la implementación actual

El código contiene referencias a endpoints `/api/load` y `/api/save`; para que la persistencia en servidor funcione, debe existir un backend que implemente esos endpoints. El servidor estático incluido en este repositorio no los implementa por sí solo.

## 🚀 Ejecutar localmente

### Requisitos

- Node.js y npm instalados.

### Pasos

1. Clona el repositorio:

   ```bash
   git clone https://github.com/Jhonvera02/Ecomeq.git
   ```

2. Entra a la carpeta del proyecto:

   ```bash
   cd Ecomeq
   ```

3. Instala las dependencias:

   ```bash
   npm install
   ```

4. Inicia el servidor de desarrollo:

   ```bash
   npm run dev
   ```

El script configurado inicia `http-server` en el puerto `3000` y abre el navegador. Si no se abre automáticamente, visita:

```text
http://localhost:3000
```

## 📁 Estructura principal

```text
Ecomeq/
├── index.html          # Estructura principal de la aplicación
├── index.css           # Estilos de la interfaz
├── app.js              # Lógica principal de la aplicación
├── manifest.json       # Configuración de aplicación web progresiva
├── logo.png            # Recurso gráfico
├── data/               # Datos de ejemplo (revisar antes de publicar)
└── Ecomeq/             # Copia/versión adicional de archivos de la interfaz
```

La estructura puede cambiar a medida que el proyecto evolucione.

## 🔐 Seguridad y datos

Este repositorio debe revisarse antes de hacerlo público o utilizarlo con información real.

- No publiques contraseñas, credenciales de demostración, datos personales ni registros internos de la empresa.
- Revisa los archivos JSON dentro de `data/`: pueden contener usuarios, contraseñas o información de ejemplo que conviene sustituir por datos ficticios.
- No uses `localStorage` como mecanismo de seguridad ni como almacenamiento compartido para una aplicación empresarial.
- Para un despliegue real, implementa autenticación segura en el servidor, contraseñas con hash, autorización por roles, validación de entradas y una base de datos protegida.
- Comprueba que no se suban carpetas generadas como `node_modules/` ni información privada del entorno.

## 🛣️ Próximas mejoras

- Implementar o documentar el backend y la base de datos.
- Fortalecer autenticación, autorización y gestión de sesiones.
- Añadir pruebas y validaciones de formularios.
- Documentar capturas de pantalla y flujos de trabajo.
- Preparar una configuración segura para despliegue.

## 👨‍💻 Autor

**Jhon Vera**  
GitHub: [@Jhonvera02](https://github.com/Jhonvera02)

---

Este proyecto se presenta con fines de aprendizaje y desarrollo de software. Los nombres y procesos empresariales que aparezcan en la aplicación deben anonimizarse o contar con autorización antes de publicar el repositorio.
