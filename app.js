const express = require('express');
const fs = require('fs');
const yaml = require('js-yaml');
const LoadBalancer = require('./loadbalancer');
const WebApp = require('./web_app');
const path = require('path');

const app = express();
const port = process.env.PORT || 4000;
const configPath = 'config.yml';

app.use(express.static('public'));
app.use(express.json());

try {
  const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

  const workers = config.workers.map(workerConfig => new WebApp(workerConfig.id, config));
  const loadBalancer = new LoadBalancer(workers, config);

  const statsDir = path.join(__dirname, config.statsDir || '/tmp/stats');
  fs.promises.mkdir(statsDir, { recursive: true })
    .then(() => {
      console.log(`Stats directory created at ${statsDir}`);
    })
    .catch(error => {
      console.error('Error creating stats directory:', error);
    });

  app.get('/api/v1/hello', async (req, res) => {
    const worker = loadBalancer.getWorker();
    try {
      const result=await worker.processRequest();
      if (result.status === 'success') {
        res.json({ message: 'hello-world' });
      } else {
        res.status(500).json({ error: 'Request failed' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/worker/stats', async (req, res) => {
    const stats = loadBalancer.getStats();
    const statsFilePath = path.join(statsDir, 'worker_stats.json');
    const totalRequests = Object.values(stats.totalRequest).reduce((sum, count) => sum + count, 0);
    const formattedStats = Object.keys(stats.successRequest).map(workerName => ({
      WorkerName: workerName,
      'Success Requests': stats.successRequest[workerName],
      'Failed Requests': stats.failedRequest[workerName],
      'Average Request Time': stats.avgRequestTime[workerName] + " sec",
      'Total Requests': stats.totalRequest[workerName]
    }));
    const finalStats = {
      TotalRequests: totalRequests,
      WorkersStats: formattedStats
    };
    try {
      await fs.promises.writeFile(statsFilePath, JSON.stringify(finalStats, null, 2));
      console.log(`Statistics saved to ${statsFilePath}`);
    } catch (error) {
      console.error('Error saving statistics:', error);
    }

    

   
    res.json(finalStats);
  });

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
} catch (error) {
  console.error('Error loading configuration:', error);
}
