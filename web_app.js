class WebApp {
  constructor(id, config) {
    this.id = id;
    this.config = config;
    this.successRequests = 0;
    this.failedRequests = 0;
    this.totalRequestTime = 0;
  }

  async processRequest() {
    const avgDelay = this.config.avgDelay || 0.5;
    const failurePercentage = this.config.failure || 0;

    await new Promise(resolve => setTimeout(resolve, avgDelay * 1000));

    if (Math.random() * 100 < failurePercentage) {
      this.failedRequests++;
      return { status: 'failed', message: 'Request failed' };
    } else {
      this.successRequests++;
      this.totalRequestTime += avgDelay;
      return { status: 'success', message: 'Hello world' };
    }
  }
}

module.exports = WebApp;
