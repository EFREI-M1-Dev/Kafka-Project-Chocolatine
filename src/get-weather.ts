import { Kafka } from "kafkajs";
import axios from "axios";

const API_KEY = 'abb48788c13f44439be80458242106';

const kafka = new Kafka({
    clientId: 'weather-producer',
    brokers: ['localhost:9092']
});

const producer = kafka.producer();

const run = async (city: string) => {
    const API_URL = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city}`;
    await producer.disconnect();
    await producer.connect();
    while (true) {
        try {
            const response = await axios.get(API_URL);
            const weather = response.data;
            await producer.send({
                topic: 'weather',
                messages: [{ value: JSON.stringify(weather) }]
            });
            console.log(`${Date.now()} Produced weather record for ${weather.location.name}`);
        } catch (error) {
            console.error('Error fetching or sending data:', error);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
};

const stop = async () => {
    await producer.disconnect();
    console.log("disconnect");
};

export { run, stop };
