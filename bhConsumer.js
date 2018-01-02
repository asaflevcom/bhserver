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
		console.log(lastMessage);
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
