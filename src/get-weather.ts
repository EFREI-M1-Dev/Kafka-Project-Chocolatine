import axios from "axios";
import consola from "consola";
import {KafkaClient, Producer, ProduceRequest} from "kafka-node";

const API_KEY = 'abb48788c13f44439be80458242106';
let intervals: { [key: string]: NodeJS.Timeout } = {};

export const createProducer = async (city: string, kafkaHost: string, kafkaTopic: { topic: string }, kafkaProducers: { [p: string]: Producer }): Promise<any> => {
    const client = new KafkaClient({ kafkaHost });

    const producer = new Producer(client, {
        requireAcks: 1,
        ackTimeoutMs: 100,
        partitionerType: 2,
    });

    producer.on('ready', async () => {
        consola.success(`Producer created for ${city}`);
        startWeatherUpdates(city, kafkaProducers, kafkaTopic);
    });

    producer.on('error', (error) => {
        consola.error(`Error from producer for ${city}:`, error);
    });

    kafkaProducers[city] = producer;
    return producer;
};

export const closeProducer = (city: string, kafkaProducers: { [p: string]: Producer }) => {
    if (kafkaProducers[city]) {
        kafkaProducers[city].close(() => {
            consola.success(`Producer for ${city} closed`);
        });
        delete kafkaProducers[city];
    }

    if (intervals[city]) {
        clearInterval(intervals[city]);
        delete intervals[city];
        consola.success(`Interval for ${city} cleared`);
    }
};

export const sendWeatherData = async (city: string, kafkaProducers: { [p: string]: Producer }, kafkaTopic: { topic: string }): Promise<void> => {
    const API_URL = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city}`;

    try {
        const response = await axios.get(API_URL);
        const weather = response.data;

        if (weather && kafkaProducers[city]) {
            const payloads: ProduceRequest[] = [
                {
                    topic: kafkaTopic.topic,
                    messages: JSON.stringify(weather),
                },
            ];

            kafkaProducers[city].send(payloads, (error) => {
                if (error) {
                    consola.error(`Error sending weather data for ${city} to Kafka:`, error);
                } else {
                    consola.success(`Weather data for ${city} sent to Kafka`);
                }
            });
        }
    } catch (error) {
        consola.error('Error fetching or sending data:', error);
    }
};

const startWeatherUpdates = (city: string, kafkaProducers: { [p: string]: Producer }, kafkaTopic: { topic: string }) => {
    intervals[city] = setInterval(async () => {
        await sendWeatherData(city, kafkaProducers, kafkaTopic);
    }, 5000);
    consola.success(`Started weather updates for ${city}`);
};