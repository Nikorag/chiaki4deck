import express, { type Express } from "express";
import http from "http";
import { Server, type Socket } from "socket.io";
import { DiscoverySocketRoute } from "./routes/DiscoverySocketRoute";
import { RegisterSocketRoute } from "./routes/RegisterSocketRoute";
import path from "path";
import router from "./routes/routes";

const app: Express = express();
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// // @ts-expect-error
// app.engine("hbs", exphbs({
// 	defaultLayout: "layout",
// 	extname: "hbs",
// 	layoutsDir: path.join(__dirname, "views/layouts"),
// 	partialsDir: path.join(__dirname, "views"),
// }));
// app.set("views", path.join(__dirname, "views"));
// app.set("view engine", "hbs");

const server: http.Server = http.createServer(app);
const io: Server = new Server(server, {
	cors : {
		origin : ["http://localhost:8081", "http://localhost:9944"]
	}
});
const port: number = 9944;

// Socket routes
const discoverySockets: DiscoverySocketRoute = new DiscoverySocketRoute(io);
const registerSockets: RegisterSocketRoute = new RegisterSocketRoute(io);

// Serve your static files (if any)
// app.use(express.static("public"));
app.use("/", router);

const vuePath : string = path.join(__dirname, "../client/build");
app.use(express.static(vuePath));

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
