class LoadBalancer {
    constructor(numServers) {
      this.numServers = numServers;
      this.servers = Array.from({ length: numServers }, () => []);
    }
  
    addDevice(deviceId) {
      const serverIndex = this.getLeastLoadedServer();
      this.servers[serverIndex].push(deviceId);
      return serverIndex;
    }
  
    removeDevice(deviceId) {
      for (const server of this.servers) {
        const index = server.indexOf(deviceId);
        if (index !== -1) {
          server.splice(index, 1);
          break;
        }
      }
    }
  
    getLeastLoadedServer() {
      let minLoad = Infinity;
      let serverIndex = 0;
      for (let i = 0; i < this.numServers; i++) {
        if (this.servers[i].length < minLoad) {
          minLoad = this.servers[i].length;
          serverIndex = i;
        }
      }
      return serverIndex;
    }
  }
  
  module.exports = LoadBalancer;
  