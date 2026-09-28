# 🎨 PuvloBuilder Frontend

Interfaz visual y Page Builder para la plataforma modular multi-tenant **PuvloBuilder**.

## 🚀 Tecnologías

- **React 19** + **TypeScript**
- **Vite**
- **Tailwind CSS v4**
- **Lucide Icons**
- **SweetAlert2** (tema Dark Glassmorphism inspirado en Apple)

## 📁 Estructura del Proyecto

```text
src/
├── api/            # Cliente Axios con interceptores y tokens de sesión
├── assets/         # Recursos gráficos e imágenes estáticas
├── context/        # AuthContext de doble nivel (SuperAdmin y Sub-Admin Tenant)
├── pages/
│   ├── SuperAdminLogin.tsx       # Acceso maestro (/login)
│   ├── SuperAdminDashboard.tsx   # Panel de control de proyectos (/admin)
│   ├── ProjectEditor.tsx         # Editor general y constructor visual (/admin/proyectos/:id/editor)
│   ├── ProjectUserLogin.tsx      # Login independiente por tenant (/:prefix/:slug/login)
│   └── ProjectSiteView.tsx       # Renderizador público dinámico (/:prefix/:slug)
├── utils/
│   └── alerts.ts                 # Modales y alertas SweetAlert2 con diseño Apple
├── App.tsx                       # Enrutador dinámico
└── main.tsx                      # Punto de entrada de React
```

## 🛠️ Instalación y Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo en puerto 3000
npm run dev

# Compilar para producción
npm run build
```

## 🔗 Conexión con el Backend

El frontend se conecta con la API de Fastify (`http://localhost:4000`) mediante el proxy de Vite configurado para:
- `/api` -> Peticiones REST y autenticación
- `/storage` -> Archivos e imágenes estáticas de tenants
