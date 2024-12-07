# AlbinGPT
ChatGPT Frontend Project using the OpenAI API, specifically GPT-4o when using the project's standard settings.

## Table of Contents

1. [Technologies](#technologies)
2. [Installation](#installation)
3. [Usage](#usage)
4. [License](#license)

## Technologies

### Frontend
- Currently no frontend framework (because I didn't know any better and didn't think I'd need one initially)
- W3 CSS to tie some stuff together
- My own HTML, CSS and Javascript

### Backend
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/) - for building RESTful APIs
- [Cors](https://www.npmjs.com/package/cors) - to bypass the same-origin policy
- [MongoDB](https://www.mongodb.com/) - for database management
- [OpenAI API](https://platform.openai.com/docs/api-reference/introduction) - to interact with ChatGPT

## Installation

### Prerequisites

- Node.js
- NPM
- MongoDB (local instance)
  - Project built for local installation, further instructions below

### Steps

1. **Clone the repository**
2. **Install dependencies**
    - Navigate to the server directory and run  `npm install`
3. **Installing and setting up MongoDB**
    - Install the MongoDB Community Edition from the [MongoDB website](https://www.mongodb.com/try/download/community)
    - Follow the instructions on screen and add the bin folder to system paths
      - Install MongoDB Compass if you want to visually view the database
    - Installing the [MongoDB Shell](https://www.mongodb.com/try/download/shell) is optional but recommended
      - Extract the shell zip-folder in the same directory as MongoDB and add the bin folder to the system path
4. **Setup Environment Variables** <br>
    - Create a `.env` file in the server directory based on the `.env.example` file, and update the necessary fields: <br>
```plaintext
OPENAI_API_KEY=your_openai_api_key
MONGO_URI=your_mongo_connection_string
```
5. **Run the Application** <br>
The database and the Server should be opened in separate terminals. You can also open another terminal and type in `mongosh` to open the MongoDB shell to controll the database, if you have it installed. <br>
- Database
    - Initialize the database by navigating to the server directory and entering the following code: <br>
```plaintext
  mkdir database
  mongod --dbpath .\database
```
- Server and Client
    -  Start the server by running `npm start` or `node server.js` in the server directory. <br>
    - The server should be accessible at `http://localhost:5000` by default. <br>
    - To start the frontend simply navigate to the client directory and open the Albin.HTML file in the browser of your choice. <br>

## Usage

1. Start chatting with Albin through the provided interface.
2. Monitor backend API calls and logs though the server console to ensure smooth operation.
3. Monitor the database either through mongosh or MongoDB Compass if you installed it.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
