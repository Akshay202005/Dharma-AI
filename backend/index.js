import dotenv from "dotenv";
dotenv.config()
import express from "express";
import cors from "cors";
import connectDb from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import http from 'http';
import cookieParser from "cookie-parser";
import contactRouter from "./routes/contact.routes.js";
import userRouter from "./routes/user.routes.js";
import chatRouter from "./routes/chat.routes.js";
import krishnaRouter from "./routes/krishna.routes.js";
import path from "path";

const app = express()
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
const server = http.createServer(app)

const port = process.env.PORT || 5000
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
}))

// Routes
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/contact", contactRouter);
app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/krishna", krishnaRouter);

app.use("/audio", express.static(path.join(process.cwd(), "uploads", "audio")));

//
connectDb().then(() => {
    server.listen(port, () => {
        console.log(`server started at ${port}`)
    })
})