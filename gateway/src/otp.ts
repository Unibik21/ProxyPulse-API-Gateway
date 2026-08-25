import nodemailer from 'nodemailer';
import { redis } from './redis.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { createHash } from 'crypto';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtp(
  req: FastifyRequest,
  reply: FastifyReply,
  email: string
) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpKey = `otp:${email}`;

  await redis.set(otpKey, otp);
  await redis.expire(otpKey, 300);

  await transporter.sendMail({
    from: `"API Gateway" <no-reply@example.com>`,
    to: email,
    subject: 'Your OTP Verification Code',
    text: `Your OTP verification code is: ${otp}. It will expire in 5 minutes.`,
    html: `<p>Your OTP verification code is: <strong>${otp}</strong>. It will expire in 5 minutes.</p>`,
  });

  reply.status(200).send({ message: 'OTP sent to email' });
}

export async function verifyOtp(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<boolean> {
  const { otp } = req.body as { otp: string };
  const email = (req.headers['x-email'] as string | undefined) || 'unknown';

  if (!otp || !email) {
    reply.status(400).send({ error: 'Missing OTP or email' });
    return false;
  }

  const otpKey = `otp:${email}`;
  const storedOtp = await redis.get(otpKey);

  if (!storedOtp || storedOtp !== otp) {
    reply.status(400).send({ error: 'Invalid or expired OTP' });
    return false;
  }

  await redis.del(otpKey);

  const hashedKey = createHash('sha256').update(email).digest('hex');
  await redis.sadd('valid_api_keys', hashedKey);
  await redis.set(`api_key_meta:${hashedKey}`, JSON.stringify({ userId: email }));

  return true;
}