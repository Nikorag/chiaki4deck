import express, { type Express } from "express";
import http from "http";
import { Server, type Socket } from "socket.io";
import { DiscoverySocketRoute } from "./routes/DiscoverySocketRoute";
import { RegisterSocketRoute } from "./routes/RegisterSocketRoute";
import { StreamSocketRoute } from "./routes/StreamSocketRoute";
import path from "path";

const app: Express = express();

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
const streamSockets : StreamSocketRoute = new StreamSocketRoute(io);

const vuePath : string = path.join(__dirname, "../client/build");
app.use(express.static(vuePath));

io.on("connection", (socket: Socket) => {
	console.log("A user connected");
	discoverySockets.socketConnection(socket);
	registerSockets.socketConnection(socket);
	streamSockets.socketConnection(socket);

	// Handle disconnection
	socket.on("disconnect", () => {
		console.log("User disconnected");
	});
});

server.listen(port, () => {
	console.log(`Server is running at http://localhost:${port}`);
});
