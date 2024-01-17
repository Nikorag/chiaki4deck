import {WebChiakiConstants} from "./constants/WebChiakiConstants";
import {SonyConsole} from "./models/Core";
import {DiscoveryCallback, initDiscovery} from "./service/DiscoveryService";
import express from 'express';
import http from 'http';
import {Server, Socket} from 'socket.io';
import {getRegisteredHosts, register} from "./service/RegistrationService";
import {RegistrationAddressType, RegistrationForm} from "./models/Registration";

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = 9944;

const discoveredHosts : SonyConsole[] = [];
const registeredHosts : SonyConsole[] = getRegisteredHosts();

// Serve your static files (if any)
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/views/register.html');
});

io.on('connection', (socket: Socket) => {
  console.log('A user connected');

  // Send a welcome message to the connected client
  socket.emit('discovered_hosts', combineHosts());

//   // Listen for messages from the client
//   socket.on('clientMessage', (message: string) => {
//     console.log(`Received message from client: ${message}`);

//     // Broadcast the received message to all connected clients
//     io.emit('message', message);
//   });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

function combineHosts() : SonyConsole[] {
  let combinedHosts = discoveredHosts;
  //Add discovered hosts and check if they're registered
  combinedHosts.forEach((discoveredHost : SonyConsole) => {
    const registeredHost : SonyConsole | undefined = registeredHosts.find((h : SonyConsole) => h.hostId == discoveredHost.hostId);
    if (registeredHost){
      discoveredHost = {
        ...registeredHost,
        ...discoveredHost,
        registered : true,
        discovered : true
      }
    }
  });
  
  //Add registered hosts as undiscovered
  combinedHosts.concat(registeredHosts.filter((h) => !combinedHosts.find((ch) => ch.hostId==h.hostId)));
  return combinedHosts;
}

const hostDiscoveredCallback: DiscoveryCallback = (sonyConsole : SonyConsole | null) => {
    if (sonyConsole){
        discoveredHosts.push(sonyConsole);
    }
    io.emit('discovered_hosts', combineHosts());
};

initDiscovery(WebChiakiConstants.CHIAKI_DISCOVERY_PROTOCOL_VERSION_PS4, WebChiakiConstants.CHIAKI_DISCOVERY_PORT_PS4, hostDiscoveredCallback);
initDiscovery(WebChiakiConstants.CHIAKI_DISCOVERY_PROTOCOL_VERSION_PS5, WebChiakiConstants.CHIAKI_DISCOVERY_PORT_PS5, hostDiscoveredCallback);