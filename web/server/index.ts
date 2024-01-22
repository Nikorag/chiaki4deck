import express, { type Express } from "express";
import exphbs from "express-handlebars";
import http from "http";
import { Server, type Socket } from "socket.io";
import router from "./routes/routes";
import { DiscoverySocketRoute } from "./routes/DiscoverySocketRoute";
import { RegisterSocketRoute } from "./routes/RegisterSocketRoute";
import path from "path";

const app: Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
app.engine("hbs", exphbs({
	defaultLayout: "layout",
	extname: "hbs",
	layoutsDir: path.join(__dirname, "views/layouts"),
	partialsDir: path.join(__dirname, "views"),
}));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

const server: http.Server = http.createServer(app);
const io: Server = new Server(server);
const port: number = 9944;

// Socket routes
const discoverySockets: DiscoverySocketRoute = new DiscoverySocketRoute(io);
const registerSockets: RegisterSocketRoute = new RegisterSocketRoute(io);

// Serve your static files (if any)
app.use(express.static("public"));
app.use("/", router);

io.on("connection", (socket: Socket) => {
	console.log("A user connected");
	discoverySockets.socketConnection(socket);
	registerSockets.socketConnection(socket);

	// Handle disconnection
	socket.on("disconnect", () => {
		console.log("User disconnected");
	});
});

server.listen(port, () => {
	console.log(`Server is running at http://localhost:${port}`);
});
