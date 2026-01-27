const prisma = require('../../prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'SUPER_SECRET_KEY'; // позже вынесем в .env

class AuthService {
  async register({ email, password, name, birthDate }) {
    const candidate = await prisma.user.findUnique({ where: { email } });
    if (candidate) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 7);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        birthDate: new Date(birthDate),
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  async login({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Wrong password');
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}

module.exports = new AuthService();
