# AlbinGPT

ChatGPT Frontend Project using the OpenAI API, specifically GPT-4o when using the project's standard settings. <br> <br> This projects was primarily made to learn how to make use of HTML, CSS and Javascript to make a mostly static website with some dynamic elements, but also how to use Javascript on the backend with Node.js and create/control databases with MongoDB.

Live Demo (Frontend only): https://lehtimies.github.io/AlbinGPT-Frontend/
Note: This demo is only for the frontend, so no chat functionality is available unfortunately.

## Table of Contents

1. [Technologies](#technologies)
2. [Installation](#installation)
3. [Usage](#usage)
4. [Known Bugs](#known-bugs)
5. [License](#license)

## Technologies

### Frontend
- No frontend framework (because I didn't think I'd need one initially)
- My own HTML, CSS and Javascript
- [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/) server to run client in localhost

### Backend
- [Node.js](https://nodejs.org/) - For running the backend server and installing dependencies with npm
- [Express](https://expressjs.com/) - for building RESTful APIs
- [Cors](https://www.npmjs.com/package/cors) - to bypass the same-origin policy
- [MongoDB](https://www.mongodb.com/) - for database management
- [Firebase](https://firebase.google.com/) - for image file storage
- [Multer](https://www.npmjs.com/package/multer) - to handle file uploads
- [OpenAI API](https://platform.openai.com/docs/api-reference/introduction) - to interact with ChatGPT

## Installation

### Prerequisites
- Node.js
- NPM
- MongoDB (local instance)
  - Project built for local installation, further instructions below
- Firebase 

### Steps
1. **Clone the repository**
```
git clone https://github.com/Lehtimies/AlbinGPT.git
```
2. **Install dependencies**
	- Open two different terminal windows and navigate to the server directory in one and the client directory in the other.
 	- Run the `npm install` command in the server and client terminals to install the project dependencies.

3. **Installing and setting up MongoDB**
	- Install the MongoDB Community Edition from the [MongoDB website](https://www.mongodb.com/try/download/community).
	- Follow the instructions on screen and add the bin folder to system paths.
		- Install MongoDB Compass if you want to visually view the database.
	- Installing the [MongoDB Shell](https://www.mongodb.com/try/download/shell) is optional but recommended.
		- Extract the shell zip-folder in the same directory as MongoDB and add the bin folder to the system path.

4. **Setting up Firebase**
	- Open the [Firebase console](https://console.firebase.google.com/) and login.
 	- Create a new project AlbinGPT (or whatever you want to call it).
  	- Navigate to storage (located in Build) and follow the instructions to create a bucket that you can use to upload images to.
   		- Copy the storage bucket address (adress after gs:// in storage) and add it to the `.env` later.
   	- Create a new private key (Project settings => Service accounts => Generate new private key).
   		- Rename the key to `firebase-service-key.json` and move it to the server directory.

5. **Setup Environment Variables** <br>
	- Create a `.env` file in the server directory based on the `.env.example` file, and update the necessary fields: <br>
```plaintext
OPENAI_API_KEY=your_openai_api_key
MONGO_URI=your_mongo_connection_string
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
```

6. **Run the Application** <br>
The server and client terminals should now be open in separate tabs/windows. You can also open a third terminal and type in `mongosh` to open the MongoDB shell to controll the database, if you have it installed. <br>
- Database
    - Initialize the database by navigating to the server directory and entering the following commands: <br>
```plaintext
mkdir database
mongod --dbpath .\database
```
- Server and Client 
    - With the database initialized you can now start the client and server.
    - To start the server and client run `npm start` in their respective terminals. The server and client should now be running in two different terminals and should be accessible at `http://localhost:5000` and  `http://localhost:3000` respectively by default. <br>

## Usage

1. Start chatting with Albin through the provided interface.
2. Paste in up to 5 screenshots to send to Albin for analysis.
3. Monitor backend API calls and logs though the server console to ensure smooth operation.
4. Monitor the database either through mongosh or MongoDB Compass if you installed it.

## Known Bugs
- Spam-pasting images overrides the image limit.
- The cursor doesn't behave properly when pressing enter at the end of the input message.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
