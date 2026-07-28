# سامانه مشاوره حقوقی (Law Consultant)

یک وب‌اپلیکیشن full-stack فارسی برای مشاوره حقوقی با Express، Next.js، PostgreSQL و Prisma.

## ساختار پروژه

```
LAW/
├── docker-compose.yml    # PostgreSQL روی پورت 5433
├── backend/              # Express API (پورت 4000)
├── frontend/             # Next.js (پورت 3000)
└── .env.example          # نمونه متغیرهای محیطی
```

## پیش‌نیازها

- Node.js 20+
- Docker Desktop
- npm

## راه‌اندازی localhost (گام‌به‌گام)

### ۱. دیتابیس (Docker)

```bash
cd /Users/sajad/Desktop/LAW
docker compose up -d
```

**چه اتفاقی می‌افتد؟** Docker یک کانتینر PostgreSQL 16 می‌سازد. پورت **5433** روی Mac شما به پورت 5432 داخل کانتینer map می‌شود (چون 5432 قبلاً اشغال است).

### ۲. تنظیم env بک‌اند

```bash
cp .env.example backend/.env
```

فایل `backend/.env` را باز کنید. مقادیر JWT و DATABASE_URL از قبل در seed تنظیم شده‌اند.

### ۳. نصب و migration

```bash
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
```

**seed چه می‌سازد؟**
- ادمین: شماره ملی `0000000000` — رمز `Admin@123`
- ۴ دسته: اظهارنامه، قراردادنویسی، مشاوره، لایحه
- کد تخفیف `WELCOME100` (۱۰۰٪ تخفیف، فقط اولین خرید)

### ۴. اجرای بک‌اند

```bash
npm run dev
```

سرور روی `http://localhost:4000` — تست: `GET /api/health`

### ۵. اجرای فرانت‌اند

ترمینال جدید:

```bash
cd frontend
npm install
cp ../.env.example .env.local   # یا NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev
```

سایت: `http://localhost:3000`

---

## نقش‌ها (Roles)

| نقش | فارسی | توضیح |
|-----|-------|-------|
| CUSTOMER | شخص حقیقی | کاربر عادی |
| COWORKER | همکار | با کد معرف به بازاریاب وصل می‌شود |
| MARKETER | بازاریاب | همکاران + درخواست بودجه |
| ADMIN | مدیر | قیمت‌گذاری، پرداخت‌ها، وبلاگ |

## جریان کار (Flow)

1. کاربر روی یکی از ۴ دکمه صفحه اصلی کلیک می‌کند
2. سوال را می‌نویسد → وضعیت `PENDING_PRICE`
3. ادمین قیمت و مهلت پاسخ را تعیین می‌کند → `PRICED`
4. کاربر پرداخت می‌کند (زرین‌پال sandbox یا رایگان با تخفیف ۱۰۰٪)
5. ادمین پرداخت و اطلاعات کاربر را می‌بیند

## کمیسیون بازاریاب

| تعامل | درصد |
|-------|------|
| اول | ۱۰٪ |
| دوم | ۷٪ |
| سوم به بعد | ۵٪ |

**مهم:** کمیسیون از **قیمت اصلی** (قبل از تخفیف) محاسبه می‌شود. حتی با کد ۱۰۰٪ تخفیف در اولین خرید، بازاریاب ۱۰٪ قیمت اصلی را دریافت می‌کند.

## احراز هویت JWT

- **Access Token:** ۱۵ دقیقه — در localStorage فرانت
- **Refresh Token:** ۷ روز — در localStorage، برای تمدید access
- ورود با **شماره ملی/شماره ثبت شرکت** + **رمز عبور**

---

## استقرار روی Liara (۳ سرویس جدا)

### ۱. دیتابیس PostgreSQL

در پنل Liara یک **Database > PostgreSQL** بسازید. `DATABASE_URL` را کپی کنید.

### ۲. بک‌اند

```bash
cd backend
liara deploy --app law-backend
```

متغیرهای محیطی در Liara:
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `FRONTEND_URL` = آدرس فرانت Liara
- `ZARINPAL_MERCHANT_ID`, `ZARINPAL_SANDBOX=false`
- `ZARINPAL_CALLBACK_URL` = `https://law-backend.liara.run/api/payments/verify`

Build command: `npm install && npx prisma generate && npm run build`
Start: `npx prisma migrate deploy && npm start`

### ۳. فرانت‌اند

```bash
cd frontend
liara deploy --app law-frontend
```

متغیر: `NEXT_PUBLIC_API_URL` = آدرس بک‌اند Liara

Build: `npm install && npm run build`
Start: `npm start`

---

## API endpoints اصلی

| Method | Path | توضیح |
|--------|------|-------|
| POST | /api/auth/register | ثبت‌نام |
| POST | /api/auth/login | ورود |
| POST | /api/auth/refresh | تمدید token |
| POST | /api/requests | ثبت درخواست |
| PATCH | /api/admin/requests/:id/price | تعیین قیمت |
| POST | /api/payments/initiate/:requestId | شروع پرداخت |
| GET | /api/marketer/profile | پروفایل بازاریاب |

---

## حساب تست

| نقش | شماره ملی | رمز |
|-----|-----------|-----|
| ADMIN | 0000000000 | Admin@123 |

برای تست بازاریاب/همکار از صفحه ثبت‌نام استفاده کنید.

## زرین‌پال Sandbox

برای پرداخت واقعی در localhost، `ZARINPAL_MERCHANT_ID` sandbox را از [zarinpal.com](https://www.zarinpal.com) در `backend/.env` قرار دهید. بدون آن، پرداخت با مبلغ > 0 خطا می‌دهد؛ پرداخت رایگان (تخفیف ۱۰۰٪) بدون درگاه کار می‌کند.
