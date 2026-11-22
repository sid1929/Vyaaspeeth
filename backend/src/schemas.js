const { z } = require("zod");
const { getEvent } = require("./catalog");

const email = z.string().trim().toLowerCase().email().max(254);
const reference = z.string().regex(/^VYS-[A-Z0-9]{10}$/, "Invalid booking reference");

// .strict() rejects unknown properties, so a client cannot smuggle in unitPrice, total, status, user, etc.
const signup = z.object({
  name: z.string().trim().min(2, "Name is too short").max(60),
  email,
  password: z.string().min(8, "Password must be at least 8 characters").max(72, "Password must be at most 72 characters")
    .regex(/[A-Za-z]/, "Password needs at least one letter").regex(/[0-9]/, "Password needs at least one number"),
}).strict();

const login = z.object({ email, password: z.string().min(1).max(72) }).strict();

const booking = z.object({
  eventId: z.string().regex(/^[a-z0-9-]{1,40}$/),
  seats: z.array(z.string().regex(/^[A-Z][0-9]{1,2}$/, "Invalid seat")).min(1, "Choose at least one seat").max(10, "Maximum 10 seats per booking"),
  attendee: z.object({
    fullName: z.string().trim().min(2).max(80),
    phone: z.string().trim().regex(/^[+0-9 ()-]{7,20}$/, "Invalid phone number").optional(),
  }).strict(),
}).strict().superRefine((v, ctx) => {
  if (!getEvent(v.eventId)) ctx.addIssue({ code: "custom", path: ["eventId"], message: "Unknown event" });
  if (new Set(v.seats).size !== v.seats.length) ctx.addIssue({ code: "custom", path: ["seats"], message: "Duplicate seats" });
});

const pay = z.object({
  bookingReference: reference,
  method: z.enum(["Credit Card", "Debit Card", "UPI", "Net Banking", "Wallet"]),
  simulate: z.enum(["success", "fail"]).optional(),
}).strict();

const webhookEvent = z.object({
  id: z.string().min(8).max(64),
  type: z.enum(["payment.succeeded", "payment.failed"]),
  data: z.object({
    bookingReference: reference,
    amount: z.number().int().positive(),
    providerRef: z.string().min(4).max(64),
    method: z.string().max(30).optional(),
  }).strict(),
}).strict();

const message = z.object({
  kind: z.enum(["contact", "feedback"]),
  name: z.string().trim().min(2).max(80),
  email,
  subject: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10, "Message is too short").max(2000),
  rating: z.number().int().min(1).max(5).optional(),
  website: z.string().max(200).optional(), // honeypot: real users never fill this
}).strict();

module.exports = { signup, login, booking, pay, webhookEvent, message, reference };
