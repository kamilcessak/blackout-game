import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { signToken, UserRole } from '@/middleware/jwt';
import { prisma } from '@/lib/prisma';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body ?? {};

    // Walidacja wejścia — bez niej brak hasła powoduje crash bcrypt i generyczne 500.
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Podaj poprawny adres e-mail.' });
    }
    if (typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ error: 'Nazwa użytkownika musi mieć min. 3 znaki.' });
    }
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Hasło musi mieć min. 6 znaków.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Użytkownik z tym emailem już istnieje.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        hp: 100,
        hunger: 100,
        thirst: 100,
      },
    });

    return res.status(201).json({ message: 'Rejestracja zakończona sukcesem.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Wystąpił błąd podczas rejestracji.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};

    // Bez walidacji brak hasła => bcrypt.compare(undefined, ...) rzuca i zwraca 500.
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.status(400).json({ error: 'Wymagane pola: email i hasło.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Nieprawidłowy email lub hasło.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Nieprawidłowy email lub hasło.' });
    }

    const token = signToken({ userId: user.id, role: user.role as UserRole });

    const { password: _password, ...userWithoutPassword } = user;

    return res.status(200).json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Wystąpił błąd podczas logowania.' });
  }
};
