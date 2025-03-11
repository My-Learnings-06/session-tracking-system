class SessionManager {
    constructor(timeout) {
      this.sessions = new Map();
      this.timeout = timeout * 1000; // Convert to milliseconds
    }
  
    createSession(deviceId) {
      const session = {
        deviceId,
        lastActive: Date.now(),
        timeoutId: setTimeout(() => this.invalidateSession(deviceId), this.timeout),
      };
      this.sessions.set(deviceId, session);
      return session;
    }
  
    getSession(deviceId) {
      const session = this.sessions.get(deviceId);
      if (session) {
        clearTimeout(session.timeoutId);
        session.lastActive = Date.now();
        session.timeoutId = setTimeout(() => this.invalidateSession(deviceId), this.timeout);
      }
      return session;
    }
  
    invalidateSession(deviceId) {
      this.sessions.delete(deviceId);
    }
  
    handleReconnection(deviceId) {
      return this.getSession(deviceId) || this.createSession(deviceId);
    }
  }
  
  module.exports = SessionManager;
  