# Snevo Layered

Snevo Layered la he thong thuong mai dien tu ban giay, duoc tach lai theo kien truc phan lop de de bao tri, de test va de mo rong. Ung dung gom backend Node.js, frontend HTML/CSS/JavaScript thuan va co so du lieu Supabase PostgreSQL.

He thong hien tai phuc vu ca frontend static va REST API tren cung mot Node.js server. Khi chay local, ban truy cap website qua `http://localhost:3001`.

## Tong quan chuc nang

- Khach hang xem danh sach san pham, tim kiem, loc theo danh muc va xem chi tiet giay.
- Khach hang chon bien the theo mau/size, them vao gio hang, cap nhat so luong va xoa san pham khoi gio.
- Khach hang quan ly ho so, dia chi giao hang, xem lich su don hang, checkout va theo doi trang thai thanh toan.
- Khach hang viet danh gia san pham va xem thong ke danh gia.
- Admin/Seller quan ly san pham, danh muc, mau, size, bien the, ton kho, don hang, nhap hang va dashboard thong ke.
- He thong dung Supabase Auth cho danh tinh nguoi dung va Supabase PostgreSQL cho du lieu nghiep vu.

## Kien truc he thong

Backend di theo Layered Architecture voi luong phu thuoc mot chieu:

```text
Presentation Layer -> Business Layer -> Data Layer -> Infrastructure Layer
```

- `Presentation Layer`: route, middleware va controller. Tang nay xu ly HTTP request/response, parse body, auth middleware va goi service.
- `Business Layer`: service chua logic nghiep vu nhu validate gio hang, checkout, cap nhat ton kho, quan ly payment, review va admin workflow.
- `Data Layer`: repository truy van Supabase/PostgreSQL, an chi tiet database khoi service.
- `Infrastructure Layer`: Supabase client, constants, error classes va tien ich dung chung.

Dependency Injection duoc cau hinh trong `backend/container.js`. Day la noi noi repository, service va controller lai voi nhau.

## Cong nghe su dung

- Node.js 18+
- Native Node.js `http` module
- ES Modules
- Supabase PostgreSQL
- Supabase Auth
- Vanilla HTML, CSS, JavaScript
- Node test runner

## Cau truc thu muc

```text
snevo-layered/
|-- backend/
|   |-- business/services/        # Logic nghiep vu
|   |-- data/repositories/        # Truy van database
|   |-- infrastructure/           # Supabase, constants, errors, utils
|   |-- presentation/             # Routes, controllers, middleware
|   |-- container.js              # Dependency injection container
|   `-- server.js                 # Entry point server
|-- frontend/
|   |-- pages/                    # Cac trang HTML
|   |-- assets/css/               # CSS
|   |-- assets/js/                # JavaScript frontend managers
|   `-- assets/images/            # Anh UI va san pham
|-- config/                       # Supabase config legacy/compatibility
|-- scripts/                      # Script tao config, build, seed
|-- test/                         # Contract tests
|-- schema.sql                    # Schema PostgreSQL tren Supabase
|-- .env.example                  # Mau bien moi truong
`-- package.json
```

## Yeu cau truoc khi cai dat

Can cai san:

- Node.js tu `18.0.0` tro len
- npm
- Tai khoan Supabase
- Mot Supabase project da tao moi

Kiem tra Node va npm:

```bash
node -v
npm -v
```

## Cai dat

Di vao thu muc du an:

```bash
cd snevo-layered
```

Cai dependencies:

```bash
npm install
```

## Cau hinh bien moi truong

Tao file `.env` tu file mau:

```powershell
Copy-Item .env.example .env
```

Neu dung Git Bash/macOS/Linux:

```bash
cp .env.example .env
```

Mo `.env` va dien thong tin Supabase cua ban:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Database Configuration
DB_SCHEMA=db_nike

# Frontend Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000
API_BASE_URL=http://localhost:3001

# Environment
NODE_ENV=development

# App Configuration
APP_NAME=Snevo
APP_VERSION=1.0.0

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Configuration (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

Luu y:

- `SUPABASE_URL` lay trong Supabase Project Settings.
- `SUPABASE_ANON_KEY` co the dung o frontend.
- `SUPABASE_SERVICE_ROLE_KEY` chi duoc dung o backend, khong dua len client public.
- `DB_SCHEMA` dang mac dinh la `db_nike`, phai trung voi schema trong `schema.sql`.
- `PORT` mac dinh la `3001` neu khong khai bao.

## Setup database Supabase

1. Vao Supabase project cua ban.
2. Mo `SQL Editor`.
3. Mo file `schema.sql` trong du an.
4. Copy toan bo noi dung `schema.sql` va chay trong SQL Editor.
5. Kiem tra schema `db_nike` va cac bang chinh da duoc tao.

Nhom bang chinh:

- `profiles`, `addresses`
- `categories`, `shoes`, `colors`, `sizes`, `shoe_variants`
- `carts`
- `orders`, `order_items`, `payments`
- `reviews`, `wishlists`
- `suppliers`, `imports`

Neu Supabase Auth can trigger/profile tu dong, hay dam bao cac trigger/policy trong `schema.sql` da chay thanh cong.

## Tao frontend config

Frontend doc config tu `frontend/assets/js/config.js`. File nay duoc sinh tu `.env`.

Chay:

```bash
npm run dev:config
```

Lenh `npm run dev` cung tu dong chay `dev:config` truoc khi start server.

## Chay ung dung local

Chay development server:

```bash
npm run dev
```

Server se chay tai:

```text
http://localhost:3001
```

Mot so trang co the mo truc tiep:

- Trang chu: `http://localhost:3001`
- San pham: `http://localhost:3001/products`
- Gio hang: `http://localhost:3001/cart`
- Checkout: `http://localhost:3001/checkout`
- Don hang: `http://localhost:3001/orders`
- Profile: `http://localhost:3001/profile`
- Admin: `http://localhost:3001/admin`

Neu port `3001` dang bi chiem, server se thu tu dong chuyen sang port tiep theo trong vai lan retry. Khi do xem port thuc te trong terminal.

## Chay production/start binh thuong

Start server khong watch:

```bash
npm start
```

Hoac:

```bash
node backend/server.js
```

Build frontend vao thu muc `build/frontend`:

```bash
npm run build:frontend
```

Lenh `npm run build` hien moi tao khung build va con mot so phan TODO trong script, nen khi chay local nen uu tien `npm run dev` hoac `npm start`.

## API chinh

Base API URL:

```text
http://localhost:3001/api
```

Nhom endpoint tieu bieu:

- Product: `GET /api/products`, `GET /api/products/:id`, `POST /api/products`, `PUT /api/products/:id`
- Category: `GET /api/categories`, `POST /api/categories`
- Variant/stock: `GET /api/variants`, `GET /api/variants/shoe/:shoeId`, `PATCH /api/variants/:id/stock`
- Cart: `GET /api/cart`, `POST /api/cart`, `PUT /api/cart/:cartId`, `DELETE /api/cart/:cartId`
- Order: `GET /api/orders`, `GET /api/orders/preview`, `POST /api/orders`, `PUT /api/orders/:id/cancel`
- Payment: `GET /api/payments/:id`, `POST /api/payments/order/:orderId`, `PUT /api/payments/:id/status`
- Account: `GET /api/auth/profile`, `PUT /api/auth/profile`, `GET /api/auth/addresses`
- Review: `GET /api/products/:shoeId/reviews`, `POST /api/reviews`, `GET /api/reviews/my-reviews`
- Admin: `GET /api/admin/dashboard`, `GET /api/admin/inventory`, `GET /api/admin/orders`
- Import: `GET /api/imports`, `POST /api/imports`, `POST /api/imports/batch`

Nhieu endpoint can header dang nhap:

```text
Authorization: Bearer <access_token>
```

## Kiem thu

Thu muc test hien tai la `test/`. Co the chay contract tests bang:

```bash
npm test
```

Hoac chay truc tiep Node test runner:

```bash
node --test test/*.test.js
```

Trang thai hien tai: test runner chay duoc, nhung repo dang co 1 contract test fail o `ImportRepository` vi file nay co chuoi `supplier_name`, trong khi test `repository-phase2-contract.test.js` dang cam field do. Day la van de contract/schema can xu ly rieng neu muon test xanh hoan toan.

## Script npm

| Lenh | Chuc nang |
|---|---|
| `npm run dev` | Sinh frontend config va chay server voi `node --watch` |
| `npm run dev:config` | Sinh `frontend/assets/js/config.js` tu `.env` |
| `npm start` | Chay server Node.js |
| `npm run build:frontend` | Copy frontend vao `build/frontend` va inject config production |
| `npm run build` | Chay build script tong, hien con TODO |
| `npm run db:seed` | Goi seed script, hien cac ham seed con dang TODO |

## Quy trinh checkout

Luồng checkout co ban:

1. Khach hang xem danh sach san pham qua `GET /api/products`.
2. Khach hang chon variant theo mau/size.
3. Frontend goi `POST /api/cart` de them vao gio.
4. Frontend goi `GET /api/orders/preview` de tinh tong tien.
5. Khach hang xac nhan checkout qua `POST /api/orders`.
6. `OrderService` kiem tra dia chi, gio hang va ton kho.
7. He thong tao `orders`, `order_items`, `payments`.
8. He thong tru ton kho trong `shoe_variants`.
9. Gio hang cua user duoc clear sau khi tao don thanh cong.

## Loi thuong gap

### 1. Server chay nhung API tra loi loi database

Kiem tra `.env` da co dung:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DB_SCHEMA=db_nike`

Sau do dam bao da chay `schema.sql` tren Supabase.

### 2. Frontend goi sai API URL

Chay lai:

```bash
npm run dev:config
```

Sau do reload browser. File can duoc cap nhat la `frontend/assets/js/config.js`.

### 3. Port 3001 bi chiem

Co the doi trong `.env`:

```env
PORT=3002
API_BASE_URL=http://localhost:3002
```

Sau do chay lai:

```bash
npm run dev
```

### 4. Dang nhap/Google OAuth khong hoat dong

Kiem tra:

- Supabase Auth da bat email/password hoac provider can dung.
- `GOOGLE_CLIENT_ID` dung format `.apps.googleusercontent.com`.
- Redirect URL trong Supabase/Google OAuth da tro ve dung domain local cua ban.

## Ghi chu bao mat

- Khong commit file `.env`.
- Khong dua `SUPABASE_SERVICE_ROLE_KEY` len frontend.
- File `frontend/assets/js/config.js` co the chua anon key sau khi generate; anon key co the public, nhung service role key thi khong.
- Khi chia se source code, chi chia se `.env.example`.

## Tai lieu lien quan

- `STRUCTURE.md`: mo ta cau truc du an.
- `REFACTOR_TEAM_PLAN.md`: ke hoach refactor theo team/phase.
- `docs/architecture/DECISIONS.md`: cac quyet dinh kien truc.
- `docs/ai/`: ghi chu va log trong qua trinh refactor.
