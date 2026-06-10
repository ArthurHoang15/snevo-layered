# SNEVO E-COMMERCE PLATFORM - LAYERED ARCHITECTURE STRUCTURE

## PROJECT OVERVIEW
**Name**: Snevo E-commerce Platform  
**Type**: Nike-inspired shoe e-commerce website  
**Architecture**: Clean Layered Architecture with Dependency Injection (DI)  
**Database**: Supabase PostgreSQL

---

## FOLDER STRUCTURE

```text
snevo-layered/
├── backend/                           # ⚙️ Backend Layered Architecture
│   ├── container.js                   # 🏗️ Dependency Injection Container (Composition Root)
│   ├── server.js                      # 🚀 Server Entry Point (HTTP bootstrap, body parsing, static serving)
│   ├── infrastructure/                # 🛠️ Infrastructure Layer (Shared, database config, errors, utility constants)
│   │   ├── database/                  # 🗄️ Supabase database client
│   │   │   └── supabase.js
│   │   ├── errors/                    # 🚨 Global Custom Error Classes
│   │   │   └── ErrorClasses.js
│   │   └── utils/                     # 🔧 Constants & Utility Helpers
│   │       ├── constants.js
│   │       └── orderUtils.js
│   ├── data/                          # 📊 Data Access Layer (Repositories)
│   │   └── repositories/              # 🏛️ DB query and mutation primitives (Supabase API)
│   │       ├── BaseRepository.js      # 🏗️ Base repository abstract class
│   │       ├── ShoeRepository.js
│   │       ├── CategoryRepository.js
│   │       ├── OrderRepository.js
│   │       ├── OrderItemRepository.js
│   │       ├── CartRepository.js
│   │       ├── PaymentRepository.js
│   │       ├── ProfileRepository.js
│   │       ├── AddressRepository.js
│   │       ├── ReviewRepository.js
│   │       ├── ShoeVariantRepository.js
│   │       ├── ColorRepository.js
│   │       ├── SizeRepository.js
│   │       └── ImportRepository.js
│   ├── business/                      # 🧠 Business Logic Layer (Services)
│   │   └── services/                  # ⚙️ Business workflow rules, orchestrations, validation
│   │       ├── ProductService.js
│   │       ├── CategoryService.js
│   │       ├── OrderService.js
│   │       ├── CartService.js
│   │       ├── PaymentService.js
│   │       ├── ProfileService.js
│   │       ├── AddressService.js
│   │       ├── ReviewService.js
│   │       ├── VariantService.js
│   │       ├── ImportService.js
│   │       └── AdminService.js
│   └── presentation/                  # 🎯 Presentation Layer (HTTP Concerns Only)
│       ├── controllers/               # ⚡ Request parameter parsing, status code handling, delegation to services
│       │   ├── BaseController.js
│       │   ├── ProductController.js
│       │   ├── CategoryController.js
│       │   ├── OrderController.js
│       │   ├── CartController.js
│       │   ├── PaymentController.js
│       │   ├── ProfileController.js
│       │   ├── AddressController.js
│       │   ├── ReviewController.js
│       │   ├── VariantController.js
│       │   ├── ColorController.js
│       │   ├── SizeController.js
│       │   ├── ImportController.js
│       │   └── AdminController.js
│       ├── middleware/                # 🛡️ Authentication, CORS, File Upload, Validation
│       │   ├── auth.js
│       │   ├── cors.js
│       │   ├── upload.js
│       │   └── validation.js
│       └── routes/                    # 🛣️ URL segments parsing, method matching, controller execution
│           ├── products.js
│           ├── categories.js
│           ├── orders.js
│           ├── adminOrders.js
│           ├── cart.js
│           ├── payments.js
│           ├── auth.js
│           ├── users.js
│           ├── profiles.js
│           ├── addresses.js
│           ├── reviews.js
│           ├── variants.js
│           ├── colors.js
│           ├── sizes.js
│           ├── imports.js
│           └── admin.js
├── frontend/                          # 🎨 Frontend Nike-style UI
│   ├── assets/                        # 📦 CSS stylesheets, OOP Javascript Managers, and images
│   ├── pages/                         # 📄 HTML pages loaded dynamically
│   └── components/                    # 🧩 Reusable HTML UI components
├── config/                            # ⚙️ Compatibility wrappers for legacy system compatibility
│   ├── constants.js
│   └── supabase.js
├── scripts/                           # 📜 Seeding, config inspection, build tools
│   ├── build.js
│   ├── seed.js
│   ├── dev-config.js
│   └── ...
├── schema.sql                         # 🗄️ PostgreSQL database schema setup
└── package.json                       # 📦 NPM manifest file
```

---

## DEPENDENCY RULE & FLOW
Dependencies flow strictly inwards. Outer circles have access to inner circles, but inner circles are completely decoupled and unaware of outer circles:

$$\text{Presentation} \longrightarrow \text{Business (Services)} \longrightarrow \text{Data (Repositories)} \longrightarrow \text{Infrastructure}$$

1. **Presentation Layer** knows about Services. It does NOT import Repositories or the database client directly.
2. **Business Services Layer** knows about Repositories (received via constructor injection). It does NOT know about request objects, response streams, status codes, or controllers.
3. **Data Repositories Layer** implements raw database queries (Supabase client). It has no awareness of business validation rules or controllers.
4. **Dependency Injection (DI) container** (`backend/container.js`) wires all layers together during startup and acts as the composition root.
