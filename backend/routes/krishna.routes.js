import express from "express";
import { getKrishna } from "../controllers/krishna.controller.js";

const krishnaRouter = express.Router();

krishnaRouter.get("/", getKrishna); // public: nothing private in it

export default krishnaRouter;