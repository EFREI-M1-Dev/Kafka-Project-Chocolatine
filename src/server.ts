import {Kafka, Consumer, EachMessagePayload} from 'kafkajs';
import express, {Request, Response} from 'express';
import path from 'path';
import {WebSocket, WebSocketServer} from 'ws';
import {fileURLToPath} from 'url';
import * as http from "http";
import { run, stop } from './get-weather.js';  // Importation des fonctions run et stop

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let currentCity = 'Passavant'; // Ville par défaut

const app = express();
const port = 3000;

const kafka = new Kafka({
    clientId: 'weather-consumer',
    brokers: ['localhost:9092']
});

const server = http.createServer(app);

const consumer = kafka.consumer({groupId: 'weather-group'});

interface WeatherData {
    location: {
        name: string,
        region: string,
        country: string,
        lat: number,
        lon: number,
        tz_id: string,
        localtime_epoch: number,
        localtime: string
    },
    current: {
        last_updated_epoch: number,
        last_updated: string,
        temp_c: number,
        temp_f: number,
        is_day: number,
        condition: {
            text: string,
            icon: string,
            code: number
        },
        wind_mph: number,
        wind_kph: number,
        wind_degree: number,
        wind_dir: string,
        pressure_mb: number,
        pressure_in: number,
        precip_mm: number,
        precip_in: number,
        humidity: number,
        cloud: number,
        feelslike_c: number,
        feelslike_f: number,
        windchill_c: number,
        windchill_f: number,
        heatindex_c: number,
        heatindex_f: number,
        dewpoint_c: number,
        dewpoint_f: number,
        vis_km: number,
        vis_miles: number,
        uv: number,
        gust_mph: number,
        gust_kph: number

    }

}

const wss = new WebSocketServer({noServer: true});

wss.on('connection', function connection(ws) {
    console.log('WebSocket client connected');

    ws.on('message', async function incoming(message) {
        const city = message.toString();
        if (city) {
            currentCity = city;
            await stop();

            await run(city);
        } else {
            console.error('Received an invalid city name');
        }
    });
});

async function startConsumer() {
    await consumer.connect();
    await consumer.subscribe({topic: 'weather', fromBeginning: true});

    await consumer.run({
        eachMessage: async ({topic, partition, message}: EachMessagePayload) => {
            try {
                const weatherData: WeatherData = JSON.parse(message.value!.toString());
                console.log(`Received weather update for ${weatherData.location.name}: ${weatherData.current.temp_c}°C, ${weatherData.current.condition.text}`);

                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(weatherData));
                    }
                });
                // Envoi des données météo à l'API Express
                app.locals.latestWeatherData = weatherData; // Stocke les dernières données dans l'objet locals d'Express
            } catch (error) {
                console.error('Error parsing or processing message:', error);
            }
        },
    });
}

startConsumer().catch(error => {
    console.error('Error starting consumer:', error);
    process.exit(1);
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});


// Montage du serveur WebSocket sur le serveur HTTP
server.on('upgrade', function (request, socket, head) {
    wss.handleUpgrade(request, socket, head, function (ws) {
        wss.emit('connection', ws, request);
    });
});



app.use(express.static(path.join(__dirname, 'public')));

server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});



