import { Kafka } from 'kafkajs';

interface Weather {
    location: {
        name: string;
        region: string;
        country: string;
        lat: number;
        lon: number;
        tz_id: string;
        localtime_epoch: number;
        localtime: string;
    };
    current: {
        last_updated_epoch: number;
        last_updated: string;
        temp_c: number;
        temp_f: number;
        is_day: number;
        condition: {
            text: string;
            icon: string;
            code: number;
        };
        wind_mph: number;
        wind_kph: number;
        wind_degree: number;
        wind_dir: string;
        pressure_mb: number;
        pressure_in: number;
        precip_mm: number;
        precip_in: number;
        humidity: number;
        cloud: number;
        feelslike_c: number;
        feelslike_f: number;
        windchill_c: number;
        windchill_f: number;
        heatindex_c: number;
        heatindex_f: number;
        dewpoint_c: number;
        dewpoint_f: number;
        vis_km: number;
        vis_miles: number;
        uv: number;
        gust_mph: number;
        gust_kph: number;
    };
}

const kafka = new Kafka({
    clientId: 'weather-consumer',
    brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'weather-group' });

const run = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'weather', fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            try {
                const weatherData: Weather = JSON.parse(message.value.toString());
                const location = weatherData.location.name;
                const tempC = weatherData.current.temp_c;
                const condition = weatherData.current.condition.text;

                console.log(`Received weather update for ${location}: ${tempC}°C, ${condition}`);
                // Ajoutez ici votre logique de traitement des données météo si nécessaire

            } catch (error) {
                console.error('Error parsing or processing message:', error);
            }
        },
    });
};

run().catch(e => console.error(`[weather-consumer] ${e.message}`, e));
