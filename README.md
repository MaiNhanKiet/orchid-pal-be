# Orchid Pal Backend

Hệ thống backend cho ứng dụng quản lý và chăm sóc hoa lan thông minh, được xây dựng theo kiến trúc **Microservices** với **NestJS**.

---

## 📁 Cấu trúc thư mục

```
orchid-pal-be/
├── apps/                              # Các microservices
│   ├── api-gateway/                   # API Gateway - Điểm vào chính
│   │   ├── src/
│   │   │   ├── main.ts                # Bootstrap ứng dụng
│   │   │   ├── api-gateway.module.ts  # Module chính
│   │   │   └── modules/
│   │   │       ├── auth/              # Module xác thực
│   │   │       │   └── auth.controller.ts
│   │   │       └── users/             # Module người dùng
│   │   │           ├── user.controller.ts
│   │   │           └── user.service.ts
│   │   └── tsconfig.app.json
│   │
│   ├── user-service/                  # Microservice quản lý User
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── user-service.module.ts
│   │   │   ├── user-service.controller.ts
│   │   │   └── user-service.service.ts
│   │   └── tsconfig.app.json
│   │
│   └── notification-service/          # Microservice thông báo
│       ├── src/
│       │   ├── main.ts
│       │   ├── notification-service.module.ts
│       │   ├── notification-service.controller.ts
│       │   └── notification-service.service.ts
│       └── tsconfig.app.json
│
├── libs/                              # Thư viện dùng chung
│   ├── common/                        # Common utilities
│   │   └── src/
│   │       ├── config/                # Cấu hình
│   │       │   ├── app.config.ts
│   │       │   └── jwt.config.ts
│   │       ├── constants/             # Hằng số
│   │       │   ├── env-key.constant.ts
│   │       │   └── microservice.constant.ts
│   │       ├── decorators/            # Custom decorators
│   │       │   ├── public.decorator.ts
│   │       │   ├── roles.decorator.ts
│   │       │   └── permission.decorator.ts
│   │       ├── dtos/                  # Data Transfer Objects
│   │       │   └── login.dto.ts
│   │       ├── enums/                 # Enumerations
│   │       │   ├── role.enum.ts
│   │       │   └── permission.enum.ts
│   │       ├── filters/               # Exception Filters
│   │       │   ├── http-exception.filter.ts
│   │       │   └── rpc-exception.filter.ts
│   │       ├── guards/                # Guards
│   │       │   ├── auth.guard.ts
│   │       │   └── permission-rbac.guard.ts
│   │       ├── interceptors/          # Interceptors
│   │       │   ├── logging.interceptor.ts
│   │       │   ├── timeout.interceptor.ts
│   │       │   └── transform.interceptor.ts
│   │       ├── middlewares/           # Middlewares
│   │       ├── pipes/                 # Pipes
│   │       │   └── validation.pipe.ts
│   │       ├── rabbit-mq/             # RabbitMQ module
│   │       │   ├── rmq.module.ts
│   │       │   └── rmq.service.ts
│   │       └── rbac/                  # RBAC module
│   │           ├── rbac.module.ts
│   │           └── rbac.service.ts
│   │
│   ├── prisma/                        # Prisma ORM
│   │   ├── prisma/
│   │   │   └── schema.prisma          # Database schema
│   │   └── src/
│   │       ├── prisma.module.ts
│   │       └── prisma.service.ts
│   │
│   └── redis/                         # Redis module
│       └── src/
│           ├── redis.module.ts
│           └── redis.service.ts
│
├── docker-compose.yml                 # Docker compose config
├── package.json
├── nest-cli.json
├── tsconfig.json
└── eslint.config.mjs
```

---

## 🏗️ Kiến trúc NestJS - Request Lifecycle

NestJS xử lý request theo thứ tự sau:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT REQUEST                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. MIDDLEWARE                                                               │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Xử lý request trước khi vào route handler                                │
│  • Có thể modify request/response                                            │
│  • Ví dụ: Logging, CORS, Body parsing                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  2. GUARDS                                                                   │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Quyết định request có được phép tiếp tục hay không                       │
│  • Trả về true/false                                                         │
│  • Ví dụ: AuthGuard, RolesGuard, PermissionGuard                            │
│                                                                              │
│  📁 libs/common/src/guards/                                                  │
│  ├── auth.guard.ts          → Xác thực JWT token                            │
│  └── permission-rbac.guard.ts → Kiểm tra quyền RBAC                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  3. INTERCEPTORS (Before)                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Thực thi logic TRƯỚC khi request vào Controller                          │
│  • Có thể transform request data                                             │
│                                                                              │
│  📁 libs/common/src/interceptors/                                            │
│  ├── logging.interceptor.ts   → Log request/response                        │
│  ├── timeout.interceptor.ts   → Timeout cho request                         │
│  └── transform.interceptor.ts → Transform response format                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  4. PIPES                                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Validation & Transformation dữ liệu                                       │
│  • Ném exception nếu dữ liệu không hợp lệ                                   │
│                                                                              │
│  📁 libs/common/src/pipes/                                                   │
│  └── validation.pipe.ts → Validate DTO với class-validator                  │
│      • whitelist: true   → Loại bỏ fields không trong DTO                   │
│      • transform: true   → Tự động transform type                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  5. CONTROLLER (Route Handler)                                               │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Xử lý business logic                                                      │
│  • Gọi services, trả về response                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  6. INTERCEPTORS (After)                                                     │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Thực thi logic SAU khi Controller trả về response                        │
│  • Transform response data                                                   │
│                                                                              │
│  TransformInterceptor:                                                       │
│  {                                                                           │
│    "statusCode": 200,                                                        │
│    "message": "Success",                                                     │
│    "data": { ... }                                                           │
│  }                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  7. EXCEPTION FILTERS (Khi có lỗi)                                           │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Bắt và xử lý exceptions                                                   │
│  • Format error response                                                     │
│                                                                              │
│  📁 libs/common/src/filters/                                                 │
│  ├── http-exception.filter.ts → Xử lý HTTP exceptions                       │
│  └── rpc-exception.filter.ts  → Xử lý RPC exceptions (microservices)        │
│                                                                              │
│  Error Response Format:                                                      │
│  {                                                                           │
│    "statusCode": 400,                                                        │
│    "message": "Error message",                                               │
│    "error": "Bad Request",                                                   │
│    "timestamp": "2026-01-28T10:00:00.000Z",                                  │
│    "path": "/api/users"                                                      │
│  }                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT RESPONSE                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Chi tiết các thành phần

### Guards

```typescript
// AuthGuard - Xác thực JWT
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // 1. Kiểm tra route có @Public() không
    // 2. Extract JWT token từ header
    // 3. Verify token và attach user vào request
    // 4. Return true nếu hợp lệ, throw UnauthorizedException nếu không
  }
}
```

### Interceptors

```typescript
// TransformInterceptor - Chuẩn hóa response
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context, next) {
    return next.handle().pipe(
      map((data) => ({
        statusCode: 200,
        message: 'Success',
        data: data,
      })),
    );
  }
}
```

### Pipes

```typescript
// CustomValidationPipe - Validate DTO
export class CustomValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,      // Loại bỏ fields không trong DTO
      transform: true,      // Auto transform types
      exceptionFactory: ... // Custom error format
    });
  }
}
```

### Exception Filters

```typescript
// AllExceptionsFilter - Xử lý tất cả exceptions
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception, host) {
    // 1. Xử lý HttpException
    // 2. Xử lý RPC Error (Microservices)
    // 3. Xử lý Prisma errors
    // 4. Log và return formatted error
  }
}
```

---

## 🐳 Docker Setup

```bash
# Khởi động infrastructure
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng services
docker-compose down
```

---

## 🚀 Chạy ứng dụng

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Chạy tất cả services (development)
npm run dev

# Hoặc chạy từng service
npm run start:dev api-gateway
npm run start:dev user-service
npm run start:dev notification-service
```

---

## 📡 Microservices Communication

```
┌─────────────────┐         RabbitMQ          ┌───────────────────┐
│   API Gateway   │ ◄─────────────────────────► │   User Service    │
│   (HTTP:3000)   │                            │   (RMQ Consumer)  │
└─────────────────┘                            └───────────────────┘
         │                                              │
         │                RabbitMQ                      │
         └─────────────────────────────────────────────►│
                                               ┌───────────────────┐
                                               │ Notification Svc  │
                                               │   (RMQ Consumer)  │
                                               └───────────────────┘
```

---

## 🗃️ Database

- **PostgreSQL**: Main database (via Prisma ORM)
- **Redis**: Caching & Session management

---

## 📝 Environment Variables

```env
# App
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/orchid_pal

# RabbitMQ
RABBITMQ_URL=amqp://user:password@localhost:5672

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```
