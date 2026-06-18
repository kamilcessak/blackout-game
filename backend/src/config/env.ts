import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    'Brak zmiennej środowiskowej JWT_SECRET. Ustaw silny sekret w pliku .env (np. `node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64\'))"`).',
  );
}

export const env = {
  JWT_SECRET,
};
