let WebSocketServer = require('ws').Server;
let fs = require('fs');
let express = require('express');
let app = express();
let bodyParser = require('body-parser');

var kafka = require('kafka-node');
var HighLevelConsumer = kafka.HighLevelConsumer;
var Client = kafka.Client;

var client = new Client('localhost:2181');
var topics = [{
  topic: 'bhdata'
}];

var options = {
  autoCommit: true,
  fetchMaxWaitMs: 1000,
  fetchMaxBytes: 1024 * 1024,
  encoding: 'buffer'
};
var consumer = new HighLevelConsumer(client, topics, options);
var isRunning = false;
var lastMessage = {};
consumer.on('message', function(message) {
  var buf = new Buffer(message.value, 'binary'); // Read string into a buffer.
  var msg = JSON.parse(buf.toString('utf-8'));

  lastMessage[msg.sensor_name] = msg.sensorCalculatedValue;
  lastMessage["rawTs"] = msg.rawTs;
  lastMessage["currentEPOC"] = msg.currentEPOC;
  isRunning=true;
  setTimeout(sendWS, 200);
});

function sendWS()
{
        if (isRunning)
        {
                isRunning = false;
                //console.log(lastMessage);
				wss.broadcast(JSON.stringify(lastMessage));
        }
}

consumer.on('error', function(err) {
  console.log('error', err);
});

process.on('SIGINT', function() {
  consumer.close(true, function() {
    process.exit();
  });
});



app.use(bodyParser.json());

// Let's create the regular HTTP request and response
app.get('/', function(req, res) {

  console.log('Get index');
  fs.createReadStream('./index.htm')
  .pipe(res);
});

var port = 8282;
let server = app.listen(port, function() {

  console.log("http/ws server listening"+port);
});

app.post('/bhdata', function(req, res) {

  console.log('POST : '+req.body);
	res.send("OK");
});



let wss = new WebSocketServer({server: server});

wss.broadcast = function broadcast(data) {
let cArr = Array.from(+wss.clients);
  wss.clients.forEach(function each(client) {
    //console.log(client.readyState);
    if (client.readyState === 1) {
        console.log(data);
        
	client.send(data);
    }
  });
};

wss.on('connection', function connection(ws) {

  ws.on('message', function incoming(data) {
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === 1) {
        client.send(data);
      }
    });
  });
});

