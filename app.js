
const AuthRoutes = require("./routes/auth");
const MongoConnect = require("./utils/db").MongoConnect;
const port = 8000;
const cluster = require('node:cluster');
const totalCPUs = require('node:os').cpus().length;
const process = require('node:process');

if (cluster.isMaster) {
  console.log(`Number of CPUs is ${totalCPUs}`);
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < 2; i++) {
    cluster.fork();
  }

  cluster.on('online',function(worker){
    console.log('Worker is running on %s pid', worker.process.pid);
  })
  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    console.log("Let's fork another worker!");
    cluster.fork();
  });

} else {
  const express = require("express");
  const app = express()
  var bodyParser = require('body-parser')
  app.use(bodyParser.text())
  app.use(express.json());

  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "OPTIONS, GET, POST, PUT, PATCH, DELETE"
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
  });
  
  app.use(AuthRoutes);
  
  app.use((error, req, res, next) => {
    const status = error.statusCode || 500;
    res.status(status).send(error);
  });
  
  MongoConnect(() => {
    app.listen(port, () => console.log(`Example app listening on port ${port}!, version 2`));
  });
}



