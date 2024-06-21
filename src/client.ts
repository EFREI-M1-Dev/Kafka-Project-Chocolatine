const weatherContainer = document.getElementById('weather-container');

interface CurrentWeather {
    temp_c: number;
    condition: {
        text: string;
    };
    wind_kph: number;
    wind_dir: string;
    humidity: number;
    last_updated: string;
}

const fetchWeatherData = async () => {
    try {
        const response = await fetch('/api/weather'); // Endpoint to fetch weather data
        if (!response.ok) {
            throw new Error('Failed to fetch weather data');
        }
        const weatherData: { current: CurrentWeather } = await response.json();
        renderWeatherData(weatherData.current); // Function to render weather data
    } catch (error) {
        console.error('Error fetching weather data:', error);
    }
};

const renderWeatherData = (currentWeather: CurrentWeather) => {
    // Modify this function to display weather data in your UI
    const { temp_c, condition, wind_kph, wind_dir, humidity, last_updated } = currentWeather;

    const weatherCard = document.createElement('div');
    weatherCard.classList.add('weather-card');
    weatherCard.innerHTML = `
        <h2>Current Weather</h2>
        <p>Temperature: ${temp_c}°C</p>
        <p>Condition: ${condition.text}</p>
        <p>Wind: ${wind_kph} km/h ${wind_dir}</p>
        <p>Humidity: ${humidity}%</p>
        <p>Last updated: ${last_updated}</p>
    `;

    weatherContainer.appendChild(weatherCard);
};

// Fetch weather data on page load
fetchWeatherData();
