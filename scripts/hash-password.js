/**
 * Генерация bcrypt-хеша пароля для смены пароля через pgAdmin/SQL.
 * Запуск: node scripts/hash-password.js "твой_новый_пароль"
 * Или:    npm run hash-password -- "твой_новый_пароль"
 *
 * Скопируй вывод SQL и выполни в pgAdmin (подставь свой email или id пользователя).
 */
const bcrypt = require('bcrypt');

const password = process.argv[2];
if (!password) {
  console.error('Использование: node scripts/hash-password.js "новый_пароль"');
  console.error('Пример:       node scripts/hash-password.js "MySecret123"');
  process.exit(1);
}

const saltRounds = 10;
bcrypt.hash(password, saltRounds).then((hash) => {
  console.log('\n--- Хеш пароля (bcrypt) ---');
  console.log(hash);
  console.log('\n--- SQL для pgAdmin (сменить пароль по email) ---');
  console.log(`UPDATE "User" SET "passwordHash" = '${hash}' WHERE email = 'ТВОЙ_EMAIL@example.com';`);
  console.log('\n--- SQL для pgAdmin (сменить пароль по id пользователя) ---');
  console.log(`UPDATE "User" SET "passwordHash" = '${hash}' WHERE id = 1;`);
  console.log('\nЗамени ТВОЙ_EMAIL@example.com или id на свои данные и выполни запрос в pgAdmin.\n');
});
