const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {

  const email = process.env.BOT_ADMIN_EMAIL;
  const password = process.env.BOT_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('Bot creds missing');
  }

  const hash = await bcrypt.hash(password, 10);

  const exists = await prisma.user.findUnique({
    where: { email }
  });

  if (exists) {
    console.log('Bot user exists');
    return;
  }

  await prisma.user.create({
    data: {
      email,
      password: hash,
      role: 'ADMIN',
      phone: '+000000000',
      telegram: '@system_bot'
    }
  });

  console.log('Bot admin created');
}

main();
