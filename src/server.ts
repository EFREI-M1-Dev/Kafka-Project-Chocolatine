import express, { Request, Response } from 'express';
import path from 'path';
import { WebSocket, WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import * as http from "http";
import {closeProducer, createProducer, sendWeatherData} from './get-weather.js';
import consola from "consola";
import {KafkaClient, Producer} from "kafka-node";
import {closeConsumerGroup, createConsumerGroup} from "./monitor-weather.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

const kafkaHost = 'localhost:9092';

const kafkaTopic = {
    topic: 'weather',
    partitions: 10,
    replicationFactor: 1,
};

const kafkaClient = new KafkaClient({kafkaHost});

kafkaClient.createTopics([kafkaTopic], (error, result) => {
    if (error) {
        consola.error('Error creating Kafka topic:', error);
        process.exit(1);
    } else {
        consola.success('Kafka topic created successfully');
    }
});

const kafkaConsumerGroup = createConsumerGroup(kafkaHost, kafkaTopic);

let kafkaProducers: { [key: string]: Producer } = {};

const wss = new WebSocketServer({ noServer: true });

const server = http.createServer(app);

wss.on('connection', function connection(ws) {
    consola.success('WebSocket client connected');

    ws.on('message', async (message) => {
        const city = message.toString();
        consola.success(`Received city: ${city}`);

        if (city) {
            if (!kafkaProducers[city]) {
                kafkaProducers[city] = await createProducer(city, kafkaHost, kafkaTopic, kafkaProducers);
            } else {
                closeProducer(city, kafkaProducers);
            }
        }
    });
});

kafkaConsumerGroup.on('message', async (message) => {
    try {
        const weatherData = JSON.parse(message.value.toString());
        consola.log(`Received weather update for ${weatherData.location.name}: ${weatherData.current.temp_c}°C, ${weatherData.current.condition.text}`);

        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(weatherData));
            }
        });

        app.locals.latestWeatherData = weatherData;
    } catch (error) {
        consola.error('Error parsing or processing message:', error);
    }
});

kafkaConsumerGroup.on('error', (error) => {
    consola.error('Error from consumer:', error);
});

app.use(express.static(path.join(__dirname, '/public')));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

server.on('upgrade', function (request, socket, head) {
    wss.handleUpgrade(request, socket, head, function (ws) {
        wss.emit('connection', ws, request);
    });
});

server.listen(port, () => {
    consola.log(`Server listening at http://localhost:${port}`);
});

process.on('SIGINT', async () => {
    consola.info('SIGINT received, stopping consumer and producer');

    closeConsumerGroup(kafkaConsumerGroup, kafkaProducers);
});