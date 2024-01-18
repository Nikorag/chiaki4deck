import {WebChiakiConstants} from "./constants/WebChiakiConstants";
import {SonyConsole} from "./models/Core";
import {DiscoveryCallback, DiscoveryStartCallback, initDiscovery} from "./service/DiscoveryService";
import express, {Request, Response, Express} from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import {Server, Socket} from 'socket.io';
import {getRegisteredHosts, register} from "./service/RegistrationService";
import {RegistrationForm} from "./models/Registration";
import {API_RESPONSE} from "./models/Api";

const app : Express = express();
app.use(bodyParser.json());
const server : http.Server = http.createServer(app);
const io : Server = new Server(server);
const port : number = 9944;

let discoveredHosts : SonyConsole[] = [];
const registeredHosts : SonyConsole[] = getRegisteredHosts();

// Serve your static files (if any)
app.use(express.static('public'));

app.get('/', (req : Request, res : Response) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/register', (req : Request, res : Response) => {
  res.sendFile(__dirname + '/views/register.html');
});

app.post('/register', (req : Request, res : Response) => {
  const form : RegistrationForm = req.body;
  register(form);
  const apiResponse : API_RESPONSE = { status : "OK" };
  res.json(apiResponse)
})

io.on('connection', (socket: Socket) => {
  console.log('A user connected');

  // Send a welcome message to the connected client
  socket.emit('discovered_hosts', combineHosts());

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

function combineHosts() : SonyConsole[] {
  const combinedHosts : SonyConsole[] = discoveredHosts;
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
  combinedHosts.concat(registeredHosts.filter((h : SonyConsole) => !combinedHosts.find((ch : SonyConsole) => ch.hostId==h.hostId)));
  combinedHosts.sort((a : SonyConsole, b : SonyConsole) => a.hostId > b.hostId ? 1 : -1);
  return combinedHosts;
}

const hostDiscoveredCallback: DiscoveryCallback = (sonyConsole : SonyConsole | null) => {
    if (sonyConsole){
        discoveredHosts.push(sonyConsole);
    }
    io.emit('discovered_hosts', combineHosts());
};

const discoveryStartingCallback : DiscoveryStartCallback = () => {
  discoveredHosts = [];
}

initDiscovery(WebChiakiConstants.CHIAKI_DISCOVERY_PROTOCOL_VERSION_PS4, WebChiakiConstants.CHIAKI_DISCOVERY_PORT_PS4, hostDiscoveredCallback, discoveryStartingCallback);
initDiscovery(WebChiakiConstants.CHIAKI_DISCOVERY_PROTOCOL_VERSION_PS5, WebChiakiConstants.CHIAKI_DISCOVERY_PORT_PS5, hostDiscoveredCallback, discoveryStartingCallback);