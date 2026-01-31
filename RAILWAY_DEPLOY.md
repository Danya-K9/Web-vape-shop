# Railway Deployment Guide

## Шаги для деплоя на Railway

### 1. Создайте проект на Railway
1. Зайдите на [railway.app](https://railway.app)
2. Создайте новый проект
3. Подключите GitHub репозиторий

### 2. Добавьте PostgreSQL базу данных
1. В проекте нажмите "New" → "Database" → "Add PostgreSQL"
2. Railway автоматически создаст переменную `DATABASE_URL`

### 3. Настройте переменные окружения (Variables)

**Обязательные переменные:**
```
DATABASE_URL=postgresql://... (автоматически создается Railway)
PORT=8080 (или оставьте пустым - Railway установит автоматически)
JWT_SECRET=ваш-секретный-ключ-для-jwt
NODE_ENV=production
```

**Опциональные переменные (для Telegram бота):**
```
TELEGRAM_BOT_TOKEN=ваш-токен-бота
TELEGRAM_CHAT_ID=ваш-chat-id
BOT_ADMIN_EMAIL=admin@example.com
BOT_ADMIN_PASSWORD=пароль-админа
API_URL=https://ваш-домен.railway.app
```

**Переменные для email (Resend — обязательно для отправки кодов):**
```
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=VapeShop <noreply@ваш-домен.com>   # только после верификации домена
```
Ключ берётся в [resend.com](https://resend.com) → API Keys → Create API Key.

**Важно:** На бесплатном плане Resend без верификации домена можно отправлять письма **только на email вашего аккаунта Resend**. Чтобы отправлять на любые адреса — верифицируйте домен (см. раздел «Resend: отправка на любые email» ниже).

### 4. Настройте домен
1. В настройках проекта Railway → Settings → Domains
2. Нажмите "Generate Domain" для получения публичного URL
3. Скопируйте URL и добавьте его в переменную `API_URL`

### 5. Deploy
1. Railway автоматически задеплоит при пуше в GitHub
2. Или нажмите "Deploy" вручную в интерфейсе Railway

### 6. Проверьте работу
Откройте в браузере: `https://ваш-домен.railway.app/`

Должно появиться: `API is running and DB connected ✅`

### Troubleshooting

**"The train has not arrived at the station"**
- Проверьте логи в Railway Dashboard
- Убедитесь, что все обязательные переменные установлены
- Проверьте, что приложение успешно запустилось

**CORS ошибки**
- Убедитесь, что ваш frontend домен добавлен в `allowedOrigins` в `index.js`

**404 на /api/products**
- Проверьте логи - должны быть записи `📥 GET /api/products`
- Убедитесь, что база данных подключена
- Проверьте, что миграции Prisma выполнились (`npm run postinstall`)

**"Email service not configured - missing RESEND_API_KEY"**
1. Railway Dashboard → ваш **backend сервис** (не база данных)
2. Вкладка **Variables**
3. Нажмите **"+ New Variable"**
4. **Name:** `RESEND_API_KEY` (точно так, без пробелов)
5. **Value:** вставьте ключ из Resend (начинается с `re_`)
6. Сохраните и нажмите **Redeploy** (или дождитесь автодеплоя)

**"You can only send testing emails to your own email address"**
- Без верификации домена Resend разрешает отправку только на email аккаунта Resend.
- Решение: верифицировать домен (см. раздел ниже) или тестировать, вводя на сайте тот же email, с которым зарегистрированы в Resend.

---

## Resend: отправка на любые email (верификация домена)

Нужен **свой домен** (например `vape-shopby.com` или домен, купленный у регистратора). Поддомены Netlify (`*.netlify.app`) для почты не подходят.

### 1. Добавить домен в Resend
1. Зайдите на **https://resend.com/domains**
2. Нажмите **"Add Domain"**
3. Введите домен, например: `vape-shopby.com` (без https:// и без пути)
4. Нажмите **"Add"**

### 2. Добавить DNS-записи
Resend покажет несколько записей (SPF, DKIM и т.п.).

1. Зайдите в панель вашего регистратора домена (где покупали домен: Reg.ru, Namecheap, Cloudflare и т.д.)
2. Найдите раздел **DNS** / **Управление DNS** / **DNS Records**
3. Для каждой записи из Resend создайте запись того же типа:
   - **Type** — как в Resend (TXT, MX, CNAME)
   - **Name** / **Host** — как в Resend (часто `@` или поддомен вроде `resend._domainkey`)
   - **Value** / **Content** — скопировать из Resend целиком
4. Сохраните изменения

### 3. Дождаться верификации
1. В Resend на странице домена нажмите **"Verify"**
2. Подтверждение может занять от нескольких минут до 24 часов

### 4. Настроить EMAIL_FROM в Railway
Когда домен станет Verified:
1. Railway → Variables
2. Добавьте или измените переменную **EMAIL_FROM**
3. Значение: `VapeShop <noreply@ваш-домен.com>` (используйте ваш верифицированный домен)
4. Redeploy
