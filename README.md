# WeEat
<img width="1919" height="1076" alt="Screenshot 2024-08-26 184826" src="https://github.com/user-attachments/assets/b1572b14-de76-44b6-9c50-c76401ae5a3f" />
WeEat is a web application designed to help users create, save, and discover restaurant menus, along with the ability to leave reviews and get personalized recommendations. This project leverages Firebase Firestore for data storage, Firebase Auth for user authentication, and the Google Places API for restaurant data.


## Overview
WeEat is designed to provide a personalized dining experience. Finding a place to eat is hard when you have allergies or dietary restrictions. WeEat makes it quick to search nearby, flag potential risks and build a list of safe go-tos. Users can create their own menus, save their favorite dishes, search for restaurants, and view personalized menus tailored to their food allergies or food sensitivities. 
[Try WeEat Live](https://we-eat.app/login)

## How It Works
<img width="1999" height="1414" alt="download" src="https://github.com/user-attachments/assets/352e326e-7a4e-4d56-896a-c4239e72ab55" />
- The app calls a small proxy server for /proxy and /photo
- The proxy injects the Google Places API key server-side and returns results and photos.
- Users sign in with Firebase; saved and created menus are stored in Firestore
- Caching and simple Haversine distance sorting keeps results quick.

## Highlights
- Nearby search by keyword + radius, sorted by actual distance
- Dietary filters: quickly set user's allergens and sensitivities and view filtered menu items
- Allergen awareness: highlights restaurant menu items with tags that suggest risk (red text indicates food item contains your allergen)
- Saved and personalized menus: organize favorite menus items from menus offered on the application or build your own restaurant menus
- Personal notes: add your own notes per menu item
## Features
- User authentication and profile management
- Create, save, and manage menus
- Search for restaurants using the Google Places API
- View personalized recommendations based on food allergies
- Real-time updates with Firebase Firestore

## Tech Stack
- Frontend: React, Ionic
- Backend: Firebase Firestore, Firebase Auth, Express.js
- APIs: Google Places API, Firebase Storage
- Tools: Trello for task management, Postman for API testing
