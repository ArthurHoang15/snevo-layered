# Snevo Layered Refactor - Team Plan

> Mục tiêu: khởi tạo repo mới từ trạng thái rỗng, port/refactor dần từ `Snevo-reference` sang kiến trúc layered architecture, giữ commit history sạch cho 3 người và không kéo theo lịch sử contributor của repo cũ.

## 1. Bối cảnh

- Repo mới: thư mục clone hiện tại, gọi là `<SNEVO_LAYERED_ROOT>`.
- Repo tham chiếu: cấu hình theo máy từng thành viên bằng `SNEVO_REFERENCE_PATH`.
- Plan kiến trúc gốc: cấu hình theo máy từng thành viên bằng `SNEVO_REFACTOR_PLAN_PATH`.
- Tech stack giữ nguyên:
  - Node.js 18+
  - ES Modules, `"type": "module"`
  - Native `http` module, không dùng Express
  - Supabase PostgreSQL schema `db_nike`
  - Frontend vanilla JS/HTML/CSS giữ behavior hiện có

Thiết lập local khuyến nghị sau khi clone:

```powershell
cd <SNEVO_LAYERED_ROOT>
$env:SNEVO_LAYERED_ROOT = (Get-Location).Path
$env:SNEVO_REFERENCE_PATH = "<absolute-path-to-Snevo-reference>"
$env:SNEVO_REFACTOR_PLAN_PATH = "<absolute-path-to-SNEVO_REFACTOR_PLAN.md>"
```

Các lệnh và ghi chú trong plan dùng `<SNEVO_LAYERED_ROOT>` cho repo mới và `$env:SNEVO_REFERENCE_PATH` cho repo tham chiếu để mọi thành viên có thể dùng trên máy riêng.

Kiến trúc mục tiêu:

```text
backend/
├── presentation/
│   ├── controllers/
│   │   ├── BaseController.js          ← giữ nguyên, di chuyển từ utils/
│   │   ├── ProductController.js
│   │   ├── CategoryController.js
│   │   ├── OrderController.js
│   │   ├── CartController.js
│   │   ├── PaymentController.js
│   │   ├── ProfileController.js
│   │   ├── AddressController.js
│   │   ├── ReviewController.js
│   │   ├── VariantController.js
│   │   ├── ColorController.js
│   │   ├── SizeController.js
│   │   ├── ImportController.js
│   │   └── AdminController.js
│   ├── routes/
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── adminOrders.js
│   │   ├── cart.js
│   │   ├── payments.js
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── profiles.js
│   │   ├── addresses.js
│   │   ├── categories.js
│   │   ├── colors.js
│   │   ├── sizes.js
│   │   ├── variants.js
│   │   ├── reviews.js
│   │   ├── imports.js
│   │   └── admin.js
│   └── middleware/
│       ├── auth.js
│       ├── cors.js
│       ├── upload.js
│       └── validation.js
├── business/
│   └── services/
│       ├── ProductService.js          ← MỚI
│       ├── CategoryService.js         ← MỚI
│       ├── OrderService.js            ← MỚI
│       ├── CartService.js             ← MỚI
│       ├── PaymentService.js          ← MỚI
│       ├── ProfileService.js          ← MỚI
│       ├── AddressService.js          ← MỚI
│       ├── ReviewService.js           ← MỚI
│       ├── VariantService.js          ← MỚI
│       ├── ImportService.js           ← MỚI
│       └── AdminService.js            ← MỚI
├── data/
│   └── repositories/
│       ├── BaseRepository.js          ← tách từ BaseModel
│       ├── ShoeRepository.js          ← từ models/Shoe.js
│       ├── CategoryRepository.js      ← từ models/Category.js
│       ├── OrderRepository.js         ← từ models/Order.js
│       ├── OrderItemRepository.js     ← từ models/OrderItem.js
│       ├── CartRepository.js          ← từ models/Cart.js
│       ├── PaymentRepository.js       ← từ models/Payment.js
│       ├── ProfileRepository.js       ← từ models/Profile.js
│       ├── AddressRepository.js       ← từ models/Address.js
│       ├── ReviewRepository.js        ← từ models/Review.js
│       ├── ShoeVariantRepository.js   ← từ models/ShoeVariant.js
│       ├── ColorRepository.js         ← từ models/Color.js
│       ├── SizeRepository.js          ← từ models/Size.js
│       └── ImportRepository.js        ← từ models/Import.js
├── infrastructure/
│   ├── database/
│   │   └── supabase.js                ← từ config/supabase.js, sửa thành singleton
│   ├── errors/
│   │   └── ErrorClasses.js            ← từ utils/ErrorClasses.js
│   └── utils/
│       ├── constants.js               ← từ config/constants.js
│       └── orderUtils.js              ← từ utils/orderUtils.js
├── container.js                       ← MỚI: Dependency Injection container
└── server.js                          ← giữ, làm gọn
```

Dependency rule:

```text
Presentation -> Business Services -> Data Repositories -> Infrastructure
```

Không được có import ngược layer.

## 2. Quy tắc Git để lịch sử sạch

### Không làm

- Không fork repo cũ.
- Không mirror repo cũ.
- Không copy `.git` từ `Snevo-reference`.
- Không commit toàn bộ source cũ trong một initial commit.
- Không dùng `git add .` nếu chưa kiểm tra `git status` và `git diff --cached --stat`.
- Không thêm `Co-authored-by:` cho bạn đã qua nhóm khác.
- Không rewrite author để biến commit của người khác thành commit của nhóm mới.

### Nên làm

- Repo mới bắt đầu bằng commit nhỏ:

```bash
git commit -m "chore: initialize project repository"
```

- Port từng nhóm file nhỏ từ `Snevo-reference` sang, chỉnh cấu trúc/import trước khi commit.
- Mỗi commit nên có một ý nghĩa rõ:
  - scaffold
  - infrastructure
  - repository
  - service
  - presentation
  - integration
  - docs
- Mỗi người dùng email GitHub verified:

```bash
git config user.name "Ten Thanh Vien"
git config user.email "email-da-verify@example.com"
```

- Trước mỗi commit:

```bash
git status
git diff --cached --stat
```

- Commit khuyến nghị không quá lớn:
  - Commit code backend: khoảng 1-5 file liên quan.
  - Commit frontend/static: có thể lớn hơn, nhưng chia theo `assets`, `pages`, `components`.
  - Không commit cả `backend/`, `frontend/`, `config/`, `scripts/` cùng lúc.

## 3. Phân công tổng quan

| Thành viên | Vai trò | Mức quan trọng | Trách nhiệm chính |
|---|---|---:|---|
| Quân | Repo Bootstrap + Data/Infrastructure Owner | Cao | Dựng repo mới, làm initial scaffold, implement từ đầu infrastructure, Supabase singleton, BaseRepository, toàn bộ repository layer |
| Nhân | Business Service Owner | Cao | Implement từ đầu service layer, chuyển business logic khỏi controller, đặc biệt Order/Cart/Product |
| Hoàng | Presentation + Integration Owner | Vừa | Chỉ làm các phase sau cùng: port/adapt controllers/routes/middleware, wiring container/server, docs, frontend/static theo từng phần |

Hai phần quan trọng nhất cần implement từ đầu:

1. Repo scaffold + `data/repositories/` + `infrastructure/` giao cho Quân.
2. `business/services/` giao cho Nhân.

Phần ít business logic hơn nhưng cần cẩn thận integration và chỉ làm ở các phase sau cùng:

3. `presentation/`, `container.js`, `server.js`, docs/frontend giao cho Hoàng.

## 4. Thứ tự làm việc bắt buộc

### Phase 0 - Repo scaffold

Owner: Quân

Mục tiêu: repo mới có cấu trúc tối thiểu, chưa copy nguyên codebase.

Files tạo trước:

```text
README.md
.gitignore
package.json
backend/.gitkeep
frontend/.gitkeep
config/.gitkeep
scripts/.gitkeep
docs/.gitkeep
```

Commit gợi ý:

```bash
git add README.md .gitignore package.json backend/.gitkeep frontend/.gitkeep config/.gitkeep scripts/.gitkeep docs/.gitkeep
git commit -m "chore: initialize project structure"
```

Sau đó tạo folder layer:

```text
backend/presentation/controllers/
backend/presentation/routes/
backend/presentation/middleware/
backend/business/services/
backend/data/repositories/
backend/infrastructure/database/
backend/infrastructure/errors/
backend/infrastructure/utils/
```

Commit gợi ý:

```bash
git add backend
git commit -m "chore: scaffold layered backend folders"
```

### Phase 1 - Infrastructure layer

Owner: Quân

Mục tiêu: tạo lớp nền tảng trước, chưa đụng business logic.

Files tạo:

```text
backend/infrastructure/database/supabase.js
backend/infrastructure/errors/ErrorClasses.js
backend/infrastructure/utils/constants.js
backend/infrastructure/utils/orderUtils.js
config/supabase.js
config/constants.js
backend/utils/ErrorClasses.js
```

Nguồn tham khảo:

```text
$env:SNEVO_REFERENCE_PATH/config/supabase.js
$env:SNEVO_REFERENCE_PATH/config/constants.js
$env:SNEVO_REFERENCE_PATH/backend/utils/ErrorClasses.js
$env:SNEVO_REFERENCE_PATH/backend/utils/orderUtils.js
```

Yêu cầu implement:

- `backend/infrastructure/database/supabase.js` phải export singleton instance, không export factory tạo instance mới.
- `config/supabase.js` chỉ là backward compatibility wrapper.
- `config/constants.js` forward export sang `backend/infrastructure/utils/constants.js`.
- `backend/utils/ErrorClasses.js` forward export sang `backend/infrastructure/errors/ErrorClasses.js`.

Commit gợi ý:

```bash
git add backend/infrastructure/database/supabase.js config/supabase.js
git commit -m "feat(infrastructure): add Supabase singleton"

git add backend/infrastructure/errors/ErrorClasses.js backend/utils/ErrorClasses.js
git commit -m "feat(infrastructure): add shared error classes"

git add backend/infrastructure/utils/constants.js backend/infrastructure/utils/orderUtils.js config/constants.js
git commit -m "feat(infrastructure): add shared constants and order utilities"
```

Checklist:

- Không có import từ `presentation/`.
- Không có import từ `business/`.
- `createSupabaseConfig()` cũ không còn tạo instance mới mỗi lần gọi.

### Phase 2 - Repository layer

Owner: Quân

Mục tiêu: tách data access khỏi model cũ. Repository chỉ nói chuyện với database.

Files tạo:

```text
backend/data/repositories/BaseRepository.js
backend/data/repositories/ShoeRepository.js
backend/data/repositories/CategoryRepository.js
backend/data/repositories/OrderRepository.js
backend/data/repositories/OrderItemRepository.js
backend/data/repositories/CartRepository.js
backend/data/repositories/PaymentRepository.js
backend/data/repositories/ProfileRepository.js
backend/data/repositories/AddressRepository.js
backend/data/repositories/ReviewRepository.js
backend/data/repositories/ShoeVariantRepository.js
backend/data/repositories/ColorRepository.js
backend/data/repositories/SizeRepository.js
backend/data/repositories/ImportRepository.js
```

Nguồn tham khảo:

```text
$env:SNEVO_REFERENCE_PATH/backend/utils/BaseModel.js
$env:SNEVO_REFERENCE_PATH/backend/models/Shoe.js
$env:SNEVO_REFERENCE_PATH/backend/models/Category.js
$env:SNEVO_REFERENCE_PATH/backend/models/Order.js
$env:SNEVO_REFERENCE_PATH/backend/models/OrderItem.js
$env:SNEVO_REFERENCE_PATH/backend/models/Cart.js
$env:SNEVO_REFERENCE_PATH/backend/models/Payment.js
$env:SNEVO_REFERENCE_PATH/backend/models/Profile.js
$env:SNEVO_REFERENCE_PATH/backend/models/Address.js
$env:SNEVO_REFERENCE_PATH/backend/models/Review.js
$env:SNEVO_REFERENCE_PATH/backend/models/ShoeVariant.js
$env:SNEVO_REFERENCE_PATH/backend/models/Color.js
$env:SNEVO_REFERENCE_PATH/backend/models/Size.js
$env:SNEVO_REFERENCE_PATH/backend/models/Import.js
```

Yêu cầu implement:

- Repository `extends BaseRepository`, không `extends BaseModel`.
- Xóa toàn bộ `validationRules` khỏi repository.
- Repository chỉ import:
  - `../../infrastructure/database/supabase.js`
  - `../../infrastructure/errors/ErrorClasses.js`
  - hoặc repository base cùng folder.
- Các method query đặc thù được giữ nhưng đổi sang dùng `this.db`.

Nhóm commit gợi ý:

```bash
git add backend/data/repositories/BaseRepository.js
git commit -m "feat(repository): add base repository abstraction"

git add backend/data/repositories/ShoeRepository.js backend/data/repositories/CategoryRepository.js
git commit -m "feat(repository): add product catalog repositories"

git add backend/data/repositories/ColorRepository.js backend/data/repositories/SizeRepository.js backend/data/repositories/ShoeVariantRepository.js
git commit -m "feat(repository): add variant metadata repositories"

git add backend/data/repositories/CartRepository.js
git commit -m "feat(repository): add cart repository"

git add backend/data/repositories/OrderRepository.js backend/data/repositories/OrderItemRepository.js backend/data/repositories/PaymentRepository.js
git commit -m "feat(repository): add order and payment repositories"

git add backend/data/repositories/ProfileRepository.js backend/data/repositories/AddressRepository.js backend/data/repositories/ReviewRepository.js
git commit -m "feat(repository): add customer profile repositories"

git add backend/data/repositories/ImportRepository.js
git commit -m "feat(repository): add inventory import repository"
```

Checklist:

```bash
rg "validationRules" backend/data/repositories
rg "presentation" backend/data/repositories
rg "business" backend/data/repositories
```

Expected:

- Không thấy `validationRules`.
- Không thấy import từ `presentation`.
- Không thấy import từ `business`.

### Phase 3 - Service layer

Owner: Nhân

Mục tiêu: business logic nằm ở service, controller chỉ parse request và gọi service.

Files tạo:

```text
backend/business/services/ProductService.js
backend/business/services/CategoryService.js
backend/business/services/OrderService.js
backend/business/services/CartService.js
backend/business/services/PaymentService.js
backend/business/services/ProfileService.js
backend/business/services/AddressService.js
backend/business/services/ReviewService.js
backend/business/services/VariantService.js
backend/business/services/ImportService.js
backend/business/services/AdminService.js
```

Nguồn tham khảo:

```text
$env:SNEVO_REFERENCE_PATH/backend/controllers/productController.js
$env:SNEVO_REFERENCE_PATH/backend/controllers/CategoryController.js
$env:SNEVO_REFERENCE_PATH/backend/controllers/orderController.js
$env:SNEVO_REFERENCE_PATH/backend/controllers/CartController.js
$env:SNEVO_REFERENCE_PATH/backend/controllers/PaymentController.js
$env:SNEVO_REFERENCE_PATH/backend/controllers/ProfileController.js
$env:SNEVO_REFERENCE_PATH/backend/controllers/AddressController.js
$env:SNEVO_REFERENCE_PATH/backend/controllers/ReviewController.js
$env:SNEVO_REFERENCE_PATH/backend/controllers/VariantController.js
$env:SNEVO_REFERENCE_PATH/backend/controllers/ImportController.js
$env:SNEVO_REFERENCE_PATH/backend/controllers/AdminController.js
$env:SNEVO_REFERENCE_PATH/backend/utils/orderUtils.js
```

Yêu cầu implement:

- Service nhận repository qua constructor.
- Service không nhận `req` hoặc `res`.
- Service trả plain object hoặc throw error.
- Service không import Supabase client.
- Business validation nằm ở service.
- `OrderService.createOrder()` là phần quan trọng nhất:
  - validate `address_id`
  - validate `payment_method`
  - đọc cart
  - tính subtotal/tax/shipping/total
  - tạo order
  - tạo order items
  - trừ stock
  - tạo payment
  - auto approve nếu đủ điều kiện
  - clear cart

Nhóm commit gợi ý:

```bash
git add backend/business/services/ProductService.js backend/business/services/CategoryService.js
git commit -m "feat(service): add product catalog services"

git add backend/business/services/CartService.js
git commit -m "feat(service): add cart business rules"

git add backend/business/services/OrderService.js
git commit -m "feat(service): add order creation workflow"

git add backend/business/services/PaymentService.js
git commit -m "feat(service): add payment business rules"

git add backend/business/services/ProfileService.js backend/business/services/AddressService.js
git commit -m "feat(service): add customer account services"

git add backend/business/services/ReviewService.js backend/business/services/VariantService.js
git commit -m "feat(service): add review and variant services"

git add backend/business/services/ImportService.js backend/business/services/AdminService.js
git commit -m "feat(service): add admin inventory services"
```

Checklist:

```bash
rg "req|res|writeHead|end\\(" backend/business/services
rg "supabase|createSupabaseConfig|getAdminClient" backend/business/services
```

Expected:

- Không có `req`, `res`, `writeHead`, `res.end`.
- Không có import/gọi Supabase trực tiếp.

### Phase 4 - Presentation layer

Owner: Hoàng

Mục tiêu: controller/route/middleware nằm trong `presentation`, chỉ làm HTTP handling.

Files tạo:

```text
backend/presentation/controllers/BaseController.js
backend/presentation/controllers/ProductController.js
backend/presentation/controllers/CategoryController.js
backend/presentation/controllers/OrderController.js
backend/presentation/controllers/CartController.js
backend/presentation/controllers/PaymentController.js
backend/presentation/controllers/ProfileController.js
backend/presentation/controllers/AddressController.js
backend/presentation/controllers/ReviewController.js
backend/presentation/controllers/VariantController.js
backend/presentation/controllers/ColorController.js
backend/presentation/controllers/SizeController.js
backend/presentation/controllers/ImportController.js
backend/presentation/controllers/AdminController.js
backend/presentation/routes/products.js
backend/presentation/routes/categories.js
backend/presentation/routes/orders.js
backend/presentation/routes/adminOrders.js
backend/presentation/routes/cart.js
backend/presentation/routes/payments.js
backend/presentation/routes/auth.js
backend/presentation/routes/users.js
backend/presentation/routes/profiles.js
backend/presentation/routes/addresses.js
backend/presentation/routes/reviews.js
backend/presentation/routes/variants.js
backend/presentation/routes/colors.js
backend/presentation/routes/sizes.js
backend/presentation/routes/imports.js
backend/presentation/routes/admin.js
backend/presentation/middleware/auth.js
backend/presentation/middleware/cors.js
backend/presentation/middleware/upload.js
backend/presentation/middleware/validation.js
```

Nguồn tham khảo:

```text
$env:SNEVO_REFERENCE_PATH/backend/utils/BaseController.js
$env:SNEVO_REFERENCE_PATH/backend/controllers/*
$env:SNEVO_REFERENCE_PATH/backend/routes/*
$env:SNEVO_REFERENCE_PATH/backend/middleware/*
```

Yêu cầu implement:

- Controller nhận service qua constructor.
- Không còn `setModels()`.
- Controller không import repository.
- Controller không import Supabase.
- Controller không chứa business logic.
- Route giữ endpoint cũ để frontend không vỡ.
- `validation.js` không còn stub TODO.

Nhóm commit gợi ý:

```bash
git add backend/presentation/controllers/BaseController.js
git commit -m "feat(presentation): add base HTTP controller"

git add backend/presentation/controllers/ProductController.js backend/presentation/controllers/CategoryController.js
git commit -m "feat(presentation): add catalog controllers"

git add backend/presentation/controllers/CartController.js backend/presentation/controllers/OrderController.js backend/presentation/controllers/PaymentController.js
git commit -m "feat(presentation): add checkout controllers"

git add backend/presentation/controllers/ProfileController.js backend/presentation/controllers/AddressController.js backend/presentation/controllers/ReviewController.js
git commit -m "feat(presentation): add customer controllers"

git add backend/presentation/controllers/VariantController.js backend/presentation/controllers/ColorController.js backend/presentation/controllers/SizeController.js backend/presentation/controllers/ImportController.js backend/presentation/controllers/AdminController.js
git commit -m "feat(presentation): add admin controllers"

git add backend/presentation/routes
git commit -m "feat(presentation): add API route dispatchers"

git add backend/presentation/middleware
git commit -m "feat(presentation): add HTTP middleware"
```

Checklist:

```bash
rg "setModels" backend/presentation/controllers
rg "data/repositories" backend/presentation/controllers
rg "infrastructure/database" backend/presentation/controllers
```

Expected:

- Không có `setModels`.
- Không có import repository trực tiếp.
- Không có import Supabase trực tiếp.

### Phase 5 - Bootstrap, server, frontend/static, docs

Owner: Hoàng

Mục tiêu: wire toàn bộ dependency graph và đưa app chạy lại.

Files tạo/sửa:

```text
backend/container.js
backend/server.js
frontend/
scripts/
schema.sql
README.md
STRUCTURE.md
docs/
```

Nguồn tham khảo:

```text
$env:SNEVO_REFERENCE_PATH/backend/server.js
$env:SNEVO_REFERENCE_PATH/frontend/*
$env:SNEVO_REFERENCE_PATH/scripts/*
$env:SNEVO_REFERENCE_PATH/schema.sql
$env:SNEVO_REFERENCE_PATH/README.md
$env:SNEVO_REFERENCE_PATH/STRUCTURE.md
$env:SNEVO_REFERENCE_PATH/docs/*
```

Yêu cầu implement:

- `container.js` khởi tạo repositories, services, controllers.
- `server.js` chỉ còn bootstrap HTTP server, parse body, dispatch API/static.
- Frontend giữ behavior nhưng không cần refactor sâu trong đợt này.
- Docs phải mô tả kiến trúc mới, không mô tả repo như MVC cũ.
- `schema.sql` giữ nguyên nội dung schema.

Nhóm commit gợi ý:

```bash
git add backend/container.js
git commit -m "feat(bootstrap): add dependency injection container"

git add backend/server.js
git commit -m "refactor(server): wire layered request handling"

git add scripts package.json
git commit -m "chore: add development scripts"

git add schema.sql
git commit -m "chore(database): add Supabase schema"

git add frontend/assets
git commit -m "feat(frontend): add static assets"

git add frontend/pages frontend/components
git commit -m "feat(frontend): add storefront pages"

git add README.md STRUCTURE.md docs
git commit -m "docs: document layered architecture"
```

Checklist:

```bash
npm install
npm run dev
```

Manual API smoke tests:

```text
GET  /api/categories
GET  /api/products
GET  /api/products/search
GET  /api/cart          with token
POST /api/cart          with token
GET  /api/orders        with token
POST /api/orders        with token
GET  /api/admin/orders  with seller token
GET  /api/auth/profile  with token
PUT  /api/auth/profile  with token
```

## 5. Branching and PR workflow

Không làm trực tiếp trên `main` trừ initial scaffold.

Branches:

```text
main
├── chore/scaffold-project              Quân
├── feat/infrastructure-and-repository  Quân
├── feat/business-services              Nhân
└── feat/presentation-bootstrap         Hoàng
```

Thứ tự merge PR:

1. `chore/scaffold-project`
2. `feat/infrastructure-and-repository`
3. `feat/business-services`
4. `feat/presentation-bootstrap`
5. `docs/final-architecture-report` nếu cần tách docs cuối kỳ

Nếu service cần repository chưa có, Nhân tạo service skeleton trước nhưng không merge trước repository. Tránh commit code tạm vào `main`.

## 6. Quy tắc copy từ repo reference

Luôn đứng ở repo mới:

```powershell
cd <SNEVO_LAYERED_ROOT>
```

Copy file theo từng phần:

```powershell
Copy-Item "$env:SNEVO_REFERENCE_PATH\package.json" .\package.json
```

Sau khi copy:

1. Sửa tên project, repository URL, docs cho repo mới.
2. Sửa import path theo layer mới.
3. Chạy `git diff`.
4. Stage đúng file cần commit.
5. Commit với message đúng phạm vi.

Không copy folder `.git`:

```powershell
Get-ChildItem -Force
```

Nếu thấy `.git` bên trong folder nào ngoài root repo mới, dừng lại kiểm tra trước khi commit.

## 7. Definition of Done

Repo được coi là xong khi đạt tất cả điều kiện:

- `backend/presentation/`, `backend/business/`, `backend/data/`, `backend/infrastructure/` tồn tại.
- `backend/container.js` tồn tại và export `buildContainer`.
- `backend/infrastructure/database/supabase.js` là singleton.
- Không còn `setModels()` trong controller.
- Không còn `validationRules` trong repository.
- Controller không import repository trực tiếp.
- Controller không import Supabase trực tiếp.
- Service không nhận `req`/`res`.
- Service không import Supabase trực tiếp.
- Repository không import service/controller.
- API endpoint cũ vẫn giữ URL và response format.
- `npm run dev` không lỗi syntax/import.
- README/STRUCTURE mô tả kiến trúc layered, không mô tả MVC cũ là kiến trúc hiện tại.

## 8. Kiểm tra nhanh bằng lệnh

Chạy ở root repo mới:

```powershell
cd <SNEVO_LAYERED_ROOT>
```

Kiểm tra layer violation:

```bash
rg "setModels" backend
rg "validationRules" backend/data/repositories
rg "data/repositories" backend/presentation/controllers
rg "infrastructure/database" backend/presentation/controllers
rg "req|res|writeHead|end\\(" backend/business/services
rg "supabase|createSupabaseConfig|getAdminClient" backend/business/services
```

Expected:

- Không có kết quả ở các rule cấm.
- Nếu có kết quả, đọc file và sửa trước khi merge.

Kiểm tra Git trước khi commit:

```bash
git status
git diff --cached --stat
```

Nếu thấy commit chuẩn bị chứa quá nhiều file không liên quan, dùng:

```bash
git reset
git add -p
```

## 9. Gợi ý phân bổ đóng góp để history nhìn cân bằng

Quân nên có khoảng 8-12 commit:

- Infrastructure singleton
- Error/constants wrappers
- BaseRepository
- Catalog repositories
- Cart repository
- Order/payment repositories
- Customer repositories
- Import repository
- Repository layer verification

Nhân nên có khoảng 8-12 commit:

- Product/Category services
- Cart service
- Order preview
- Order creation workflow
- Order status update rules
- Payment service
- Profile/Address services
- Review/Variant services
- Import/Admin services
- Service layer verification

Hoàng nên có khoảng 8-12 commit:

- Initial scaffold
- Backend folders
- BaseController
- Catalog controllers
- Checkout controllers
- Customer/admin controllers
- Routes
- Middleware
- Container
- Server
- Frontend/static split
- Docs

Nếu người 3 quá nhiều file do frontend/static, chia frontend thành nhiều commit theo chức năng để commit history vẫn đọc được.

## 10. Lưu ý trình bày với giảng viên

Nên mô tả repo mới là:

> Dự án được khởi tạo lại trong repo mới và tái cấu trúc từ codebase tham chiếu Snevo sang layered architecture. Nhóm port từng module theo phase để làm rõ trách nhiệm layer, dependency injection và tách business logic khỏi controller.

Không nên mô tả là toàn bộ code được viết hoàn toàn từ zero nếu thực tế có tham chiếu/copy từ repo cũ. Lịch sử commit sạch giúp giảng viên đọc quá trình refactor rõ ràng, không phải để che nguồn gốc code.
