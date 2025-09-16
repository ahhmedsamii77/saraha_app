import { checkConnectionDB } from "./DB/connectionDB.js";
import { globalErrorHandling } from "./middleware/index.js"
import cors from "cors"
import { rateLimit } from "express-rate-limit"
import { userRouter } from "./modules/users/user.controller.js";
import { messageRouter } from "./modules/messages/message.controller.js";
import helmet from "helmet";
import cron from "node-cron"
import { otpModel } from "./DB/models/otp.model.js";
export default function bootstrap({ app, express }) {
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    handler: (req, res, next, options) => {
      res.status(400).json({ message: "Too many requests, please try again later." });
    },
    skipSuccessfulRequests: true
  });

  checkConnectionDB();

  cron.schedule("*/1 * * * * *", () => {
    otpModel.deleteMany({ expiresAt: { $lt: Date.now() } });
  });

  app.use(helmet());
  app.use(limiter);
  app.use(cors());
  app.use(express.json());

  app.get("/", (req, res, next) => {
    return res.status(200).json({ message: "welcome to my app............." });
  });

  app.use("/users", userRouter);
  app.use("/messages", messageRouter);
  app.use((req, res, next) => {
    throw new Error(`404 Not Found url ${req.originalUrl}`);
  });

  app.use(globalErrorHandling);
}


