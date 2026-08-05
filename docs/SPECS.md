# Dushi POS — Especificaciones del Backend

API REST para el sistema punto de venta **Dushi POS**.

| | |
|---|---|
| **Base URL** | `/api` |
| **Auth** | `Authorization: Bearer <access_token>` |
| **Stack** | NestJS 9 · TypeORM 0.3 · MySQL · JWT |
| **Zona horaria** | `America/Bogota` (`TZ`) / `DB_TIMEZONE` |

---

## 1. Visión general

El backend gestiona tiendas multi-tenant: cada usuario autenticado pertenece a una tienda (`storeId` en el JWT). La mayoría de recursos de negocio se filtran automáticamente por esa tienda.

### Módulos

| Módulo | Prefijo | Descripción |
|--------|---------|-------------|
| Auth | `/auth` | Login / logout |
| Stores | `/stores` | Tiendas |
| Users | `/users` | Usuarios del sistema |
| Customers | `/customers` | Clientes |
| Products | `/products` | Productos e inventario |
| Purchases | `/purchases` | Compras a proveedores |
| Sales | `/sales` | Ventas / facturas |
| Employees | `/employees` | Empleados |
| Employee payments | `/employee-payments` | Pagos a empleados |

### Convenciones

- Campos en **inglés camelCase** en JSON; columnas DB en **snake_case**.
- UUIDs como identificadores.
- Soft delete (`deleted_at`) en la mayoría de entidades de negocio.
- Validación global: `whitelist`, `forbidNonWhitelisted`, `transform`.
- Fechas de filtro: formato `YYYY-MM-DD`.
- Montos: `decimal(12,2)`, validación con máximo 2 decimales.

### Multi-tenancy

| Scoped por `storeId` del JWT | Sin scope de tienda |
|------------------------------|---------------------|
| customers, products, purchases, sales, employees, employee-payments | stores, users |

El `storeId` **no** se envía en el body de recursos scoped; se toma del token.

---

## 2. Autenticación

### Login

`POST /api/auth/login` — **público**

```json
{ "email": "user@example.com", "password": "secret" }
```

Respuesta:

```json
{
  "access_token": "<jwt>",
  "user": {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "storeId": "uuid",
    "storeName": "string",
    "role": "admin | seller"
  }
}
```

### Logout

`POST /api/auth/logout` — requiere JWT. Invalida el token en blacklist en memoria.

---

## 3. Enums

### PaymentMethod

`cash` · `card` · `nequi` · `daviplata` · `bancolombia` · `boldqr` · `rappi`

### Role

`admin` · `seller`

### IdentificationType

`CC` · `CE` · `NIT` · `PP` · `TI`

### StockMovementType

`IN` · `OUT` · `ADJUSTMENT`

---

## 4. Endpoints existentes (resumen)

Todos requieren JWT salvo login y `GET /api`.

### Stores — `/api/stores`

| Método | Ruta | Notas |
|--------|------|-------|
| POST | `/stores` | `name`, `identification`, `phone`, `email`, `address`, `city` |
| GET | `/stores` | Listado |
| GET | `/stores/:id` | Detalle |
| PATCH | `/stores/:id` | Actualizar |
| DELETE | `/stores/:id` | Hard delete · `204` |

### Users — `/api/users`

| Método | Ruta | Notas |
|--------|------|-------|
| POST | `/users` | `name`, `email`, `password` (min 6), `storeId`, `role` |
| GET | `/users` | Con relación `store` |
| GET | `/users/:id` | Detalle |
| PATCH | `/users/:id` | Actualizar |
| PATCH | `/users/:id/password` | `{ "password" }` |
| DELETE | `/users/:id` | Hard delete · `204` |

### Customers — `/api/customers`

| Método | Ruta | Notas |
|--------|------|-------|
| POST | `/customers` | `name`, `identificationType`, `identificationNumber`, `email?` |
| GET | `/customers` | Por tienda |
| GET | `/customers/:id` | Detalle |
| PATCH | `/customers/:id` | Actualizar |
| DELETE | `/customers/:id` | Soft · `204` |
| PATCH | `/customers/:id/restore` | Restaurar |

### Products — `/api/products`

| Método | Ruta | Notas |
|--------|------|-------|
| POST | `/products` | `name`, `price`, `category?`, `description?`, `imageUrl?`, `trackInventory?`, `stock?` |
| GET | `/products` | Query: `trackInventory=true\|false` |
| GET | `/products/:id` | Detalle |
| PATCH | `/products/:id` | Actualizar |
| PATCH | `/products/:id/stock` | `type` (`IN`/`OUT`/`ADJUSTMENT`), `quantity`, `reason?` |
| GET | `/products/:id/transactions` | Historial paginado (`page`, `limit`) |
| DELETE | `/products/:id` | Soft · `204` |
| PATCH | `/products/:id/restore` | Restaurar |

### Purchases — `/api/purchases`

| Método | Ruta | Notas |
|--------|------|-------|
| POST | `/purchases` | `date`, `supplier`, `paymentMethod?`, `observations?`, `total`, `items[]` |
| GET | `/purchases` | Filtros: `page`, `limit`, `startDate`, `endDate`, `search` |
| GET | `/purchases/summary` | `{ invoiceCount, totalSpent }` — mismos filtros |
| GET | `/purchases/:id` | Detalle |
| PATCH | `/purchases/:id` | Actualizar |
| DELETE | `/purchases/:id` | Soft · `204` (sin restore) |

Ítems: `{ name, quantity, unitCost }` (JSON en la compra).

### Sales — `/api/sales`

| Método | Ruta | Notas |
|--------|------|-------|
| POST | `/sales` | `subtotal`, `tax`, `total`, `paymentMethod`, `items[]`, opcionales: `rappiOrderId`, `amountPaid`, `change`, `prefix`, `customerId` |
| GET | `/sales` | Filtros: `page`, `limit`, `startDate`, `endDate`, `paymentMethod`, `number` |
| GET | `/sales/totals` | Requiere `startDate`, `endDate`; `groupBy=day\|month`; `paymentMethod?` |
| GET | `/sales/by-product` | Ventas agrupadas por producto |
| GET | `/sales/:id` | Detalle con `user`, `items`, `customer` |
| PATCH | `/sales/:id` | Actualizar |
| DELETE | `/sales/:id` | Soft · reingresa stock · `204` |
| PATCH | `/sales/:id/restore` | Restaura venta (no vuelve a descontar stock) |

Ítems: `{ productId, quantity, total }`.

---

## 5. Empleados — `/api/employees`

CRUD de empleados de la tienda. Requiere JWT. Scoped por `storeId`.

### Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | sí | Nombres |
| `phone` | string | no | Teléfono |
| `email` | email | no | Correo |
| `position` | string | sí | Cargo |
| `hireDate` | date (`YYYY-MM-DD`) | sí | Fecha de ingreso |

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/employees` | Crear empleado |
| `GET` | `/api/employees` | Listar (orden por nombre) |
| `GET` | `/api/employees/:id` | Detalle |
| `PATCH` | `/api/employees/:id` | Actualizar (campos opcionales) |
| `DELETE` | `/api/employees/:id` | Soft delete · `204` |
| `PATCH` | `/api/employees/:id/restore` | Restaurar |

### Ejemplo — crear

```http
POST /api/employees
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "María Gómez",
  "phone": "3001234567",
  "email": "maria@example.com",
  "position": "Cajera",
  "hireDate": "2026-01-15"
}
```

Respuesta:

```json
{
  "id": "uuid",
  "storeId": "uuid",
  "name": "María Gómez",
  "phone": "3001234567",
  "email": "maria@example.com",
  "position": "Cajera",
  "hireDate": "2026-01-15",
  "createdAt": "...",
  "updatedAt": "...",
  "deletedAt": null
}
```

---

## 6. Pagos a empleados — `/api/employee-payments`

Registro y gestión de días/pagos al empleado. Requiere JWT. Scoped por `storeId`.

### Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `employeeId` | UUID | sí | Empleado (debe existir en la tienda) |
| `paymentDate` | date (`YYYY-MM-DD`) | sí | Fecha de pago |
| `amount` | number ≥ 0 | sí | Monto a pagar |
| `bonus` | number ≥ 0 | no (default `0`) | Bono |
| `paymentMethod` | `PaymentMethod` | sí | Forma de pago |
| `description` | string | no | Descripción / notas |

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/employee-payments` | Crear pago |
| `GET` | `/api/employee-payments` | Listar paginado + filtros |
| `GET` | `/api/employee-payments/totals` | Totales para reporte (mismos filtros) |
| `GET` | `/api/employee-payments/:id` | Detalle (incluye `employee`) |
| `PATCH` | `/api/employee-payments/:id` | Actualizar |
| `DELETE` | `/api/employee-payments/:id` | Soft delete · `204` |

### Filtros (lista y totales)

| Query | Tipo | Descripción |
|-------|------|-------------|
| `employeeId` | UUID | Filtrar por empleado |
| `startDate` | `YYYY-MM-DD` | Desde fecha de pago |
| `endDate` | `YYYY-MM-DD` | Hasta fecha de pago |
| `hasBonus` | `true` \| `false` | Solo con bono (`> 0`) o sin bono (`= 0`) |
| `page` | int | Página (solo listado, default `1`) |
| `limit` | int | Tamaño de página (solo listado, default `10`) |

### Ejemplo — crear pago

```http
POST /api/employee-payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "employeeId": "uuid-del-empleado",
  "paymentDate": "2026-08-01",
  "amount": 1500000,
  "bonus": 100000,
  "paymentMethod": "nequi",
  "description": "Quincena julio + bono puntualidad"
}
```

### Ejemplo — listar con filtros

```http
GET /api/employee-payments?employeeId=<uuid>&startDate=2026-08-01&endDate=2026-08-31&hasBonus=true&page=1&limit=20
```

Respuesta:

```json
{
  "data": [
    {
      "id": "uuid",
      "storeId": "uuid",
      "employeeId": "uuid",
      "paymentDate": "2026-08-01",
      "amount": "1500000.00",
      "bonus": "100000.00",
      "paymentMethod": "nequi",
      "description": "...",
      "employee": { "id": "...", "name": "María Gómez", "position": "Cajera" },
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### Totales / reporte

```http
GET /api/employee-payments/totals?employeeId=<uuid>&startDate=2026-08-01&endDate=2026-08-31&hasBonus=true
```

Respuesta:

```json
{
  "paymentCount": 2,
  "totalAmount": 3000000,
  "totalBonus": 200000,
  "grandTotal": 3200000
}
```

| Campo | Significado |
|-------|-------------|
| `paymentCount` | Cantidad de pagos que cumplen el filtro |
| `totalAmount` | Suma de `amount` |
| `totalBonus` | Suma de `bonus` |
| `grandTotal` | `totalAmount + totalBonus` |

---

## 7. Soft delete

| Entidad | Delete | Restore |
|---------|--------|---------|
| Customer | soft | `PATCH .../restore` |
| Product | soft | `PATCH .../restore` |
| Employee | soft | `PATCH .../restore` |
| Sale | soft (+ reingreso stock) | `PATCH .../restore` |
| Purchase | soft | — |
| EmployeePayment | soft | — |
| Store / User | hard | — |

---

## 8. Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `DB_HOST` | Host MySQL |
| `DB_PORT` | Puerto (default `3306`) |
| `DB_USERNAME` | Usuario |
| `DB_PASSWORD` | Contraseña |
| `DB_NAME` | Base de datos (default `dushi_pos`) |
| `DB_TIMEZONE` | Offset MySQL (default `-05:00`) |
| `JWT_SECRET` | Secreto JWT (requerido) |
| `JWT_EXPIRATION` | Expiración (default `8h`) |
| `PORT` | Puerto HTTP (default `3000`) |
| `TZ` | Zona Node (default `America/Bogota`) |

---

## 9. Scripts

```bash
npm install
npm run start:dev      # desarrollo con watch
npm run start:prod     # producción
npm run seed:sales     # seed de ventas de prueba
```

Node requerido: **20.x**.
