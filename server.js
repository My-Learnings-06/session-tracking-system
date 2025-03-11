const WebSocket = require('ws');
const readline = require('readline');
const SessionManager = require('./lib/sessionManager');
const LoadBalancer = require('./lib/loadBalancer');

let K, M, T; // Configuration variables

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const logs = [];
let actions = [];

function initializeServer() {
  const sessionManager = new SessionManager(T);
  const loadBalancer = new LoadBalancer(K);

  const wss = new WebSocket.Server({ port: 8080 });

  wss.on('connection', (ws, req) => {
    ws.on('message', (message) => {
      const { action, device_id: deviceId, data, timestamp } = JSON.parse(message);
      switch (action) {
        case 'connect':
          const session = sessionManager.handleReconnection(deviceId);
          const serverIndex = loadBalancer.addDevice(deviceId);
          logs.push(`Device ${deviceId} connected at ${timestamp}s`);
          ws.send(JSON.stringify({ status: 'connected', server: serverIndex }));
          break;
        case 'disconnect':
          const activeSessionForDisconnect = sessionManager.getSession(deviceId);
          if(activeSessionForDisconnect){
            sessionManager.invalidateSession(deviceId);
            loadBalancer.removeDevice(deviceId);
            logs.push(`Device ${deviceId} disconnected at ${timestamp}s`);
            ws.send(JSON.stringify({ status: 'disconnected' }));
          } else {
            ws.send(JSON.stringify({ status: 'invalid_session' }));
          }
          break;
        case 'send_data':
          const activeSession = sessionManager.getSession(deviceId);
          if (activeSession) {
            logs.push(`Device ${deviceId} sent "${data}" at ${timestamp}s`);
            ws.send(JSON.stringify({ status: 'data_received', data }));
          } else {
            ws.send(JSON.stringify({ status: 'invalid_session' }));
          }
          break;
        default:
          ws.send(JSON.stringify({ status: 'unknown_action' }));
      }
    });
  });

  function printServerStatus() {
    console.log('Server Status:');
    loadBalancer.servers.forEach((server, index) => {
      const devices = server.map(deviceId => `Device ${deviceId} - Active Session`);
      console.log(`Server ${index + 1}: [${devices.join(', ')}]`);
    });
    console.log('Logs:');
    console.log(`[${logs.join(', ')}]`);
  }

  console.log('Server is running on ws://localhost:8080');

  // Mock WebSocket object
  class MockWebSocket {
    constructor(deviceId) {
      this.deviceId = deviceId;
      this.handlers = {};
    }

    on(event, handler) {
      this.handlers[event] = handler;
    }

    emit(event, message) {
      if (this.handlers[event]) {
        this.handlers[event](message);
      }
    }

    send(message) {
      console.log('Response:', message);
    }
  }

  // Simulate processing actions
  actions.forEach(action => {
    const ws = new MockWebSocket(action.deviceId);
    wss.emit('connection', ws, {});
    ws.emit('message', JSON.stringify(action));
  });

  // Print server status after processing actions
  printServerStatus();
}

function readActions(numActions) {
  let count = 0;

  const askAction = () => {
    rl.question('Enter action (in JSON format): ', (action) => {
      try {
        actions.push(JSON.parse(action));
        count++;
        if (count < numActions) {
          askAction();
        } else {
          rl.close();
          initializeServer();
        }
      } catch (e) {
        console.log('Invalid JSON format. Please try again.');
        askAction();
      }
    });
  };

  askAction();
}

function readConfiguration() {
  rl.question('Enter the number of servers (K): ', (numServers) => {
    K = parseInt(numServers);
    rl.question('Enter the maximum devices per server (M): ', (maxDevices) => {
      M = parseInt(maxDevices);
      rl.question('Enter the session timeout in seconds (T): ', (timeout) => {
        T = parseInt(timeout);
        rl.question('Enter the number of actions: ', (numActions) => {
          readActions(parseInt(numActions));
        });
      });
    });
  });
}

readConfiguration();
