# Kafka-Project-Chocolatine

### Théo RICHARD - M1 Dev. Manager Full Stack - Groupe 2

Cette application permet de récupérer et d'afficher les données météorologiques actuelles pour une ville donnée. Elle utilise WebSocket pour la communication en temps réel et Kafka pour la gestion des données.

## Prérequis

- Node.js
- npm ou yarn
- Docker

## Installation
```bash
npm install
```

## Lancement
```bash
docker-compose up -d
```
```bash
npm run start
```

## Utilisation
Accéder à l'application via l'URL : http://localhost:3000
Entrer le nom d'une ville dans la barre de recherche, et cliquez sur le bouton de recherche pour afficher les conditions météorologiques de cette ville.

## Structure du projet
- **server.ts** : Point d'entrée principal du serveur. Gère les connexions WebSocket et Kafka.
- **get-weather.ts** : Gère la récupération des données météorologiques et l'envoi des données à Kafka.
- **monitor-weather.ts** : Gère la consommation des données météorologiques depuis Kafka.
- **public/index.html** : Contient le HTML de base pour l'interface utilisateur.