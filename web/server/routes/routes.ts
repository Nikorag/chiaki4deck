import express, { type Request, type Response, type Router } from "express";

const router: Router = express.Router();

router.get("/", (req: Request, res: Response) => {
	res.render("index", {});
});

router.get("/register", (req: Request, res: Response) => {
	res.render("register", {"layout" : false});
});

export default router;