class LoadBalancer {
  constructor(workers, config) {
    this.workers = workers;
    this.currentWorkerIndex = 0;
    this.config = config;
  }

  getWorker() {
    const worker = this.workers[this.currentWorkerIndex];
    this.currentWorkerIndex = (this.currentWorkerIndex + 1) % this.workers.length;
    return worker;
  }

  getStats() {
    const stats = {
      successRequest: {},
      failedRequest: {},
      totalRequest: {},
      avgRequestTime: {},
    };

    for (const worker of this.workers) {
      stats.successRequest[worker.id] = worker.successRequests;
      stats.failedRequest[worker.id] = worker.failedRequests;
      stats.totalRequest[worker.id] = worker.successRequests + worker.failedRequests;
      stats.avgRequestTime[worker.id] = worker.totalRequestTime / stats.totalRequest[worker.id] || 0;
    }

    return stats;
  }
}

module.exports = LoadBalancer;
