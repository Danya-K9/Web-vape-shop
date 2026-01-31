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

**Опциональные переменные (для email):**
```
EMAIL_SERVICE=gmail
EMAIL_USER=ваш-email@gmail.com
EMAIL_PASSWORD=пароль-приложения
```

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
