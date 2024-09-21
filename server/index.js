// index.js
// Required modules
const express = require('express');
const path = require('path');
const fs = require('fs').promises;

// Initialize Express application
const app = express();

// Define paths
const clientPath = path.join(__dirname, '..', 'client/src');
const dataPath = path.join(__dirname, 'data', 'superheroes.json');
const serverPublic = path.join(__dirname, 'public');
// Middleware setup
app.use(express.static(clientPath)); // Serve static files from client directory
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.json()); // Parse JSON bodies

// Routes

// Home route
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: clientPath });
});

app.get('/superheroes', async (req, res) => {
    try {
        const data = await fs.readFile(dataPath, 'utf8');

        const superheroes = JSON.parse(data);
        if (!superheroes) {
            throw new Error("Error no superheroes available");
        }
        res.status(200).json(superheroes);
    } catch (error) {
        console.error("Problem getting superheroes" + error.message);
        res.status(500).json({ error: "Problem reading superheroes" });
    }
});

// Form route
app.get('/heroForm', (req, res) => {
    res.sendFile('pages/form.html', { root: serverPublic });
});

// Form submission route
app.post('/heroForm', async (req, res) => {
    try {
        const { name, universe, message } = req.body;

        // Read existing users from file
        let superheroes = [];
        try {
            const data = await fs.readFile(dataPath, 'utf8');
            superheroes = JSON.parse(data);
        } catch (error) {
            // If file doesn't exist or is empty, start with an empty array
            console.error('Error reading user data:', error);
            superheroes = [];
        }

        // Find or create user
        let user = superheroes.find(u => u.name === name && u.universe === universe);
        if (user) {
            user.messages.push(message);
        } else {
            user = { name, universe, messages: [message] };
            superheroes.push(user);
        }

        // Save updated users
        await fs.writeFile(dataPath, JSON.stringify(superheroes, null, 2));
        res.redirect('/heroForm');
    } catch (error) {
        console.error('Error processing hero form:', error);
        res.status(500).send('An error occurred while processing your submission.');
    }
});

// Update user route (currently just logs and sends a response)
app.put('/update-user/:currentName/:currentUniverse', async (req, res) => {
    try {
        const { currentName, currentUniverse } = req.params;
        const { newName, newUniverse } = req.body;
        console.log('Current user:', { currentName, currentUniverse });
        console.log('New user data:', { newName, newUniverse });
        const data = await fs.readFile(dataPath, 'utf8');
        if (data) {
            let superheroes = JSON.parse(data);
            const userIndex = superheroes.findIndex(user => user.name === currentName && user.universe === currentUniverse);
            console.log(userIndex);
            if (userIndex === -1) {
                return res.status(404).json({ message: "User not found" })
            }
            superheroes[userIndex] = { ...superheroes[userIndex], name: newName, universe: newUniverse };
            console.log(superheroes);
            await fs.writeFile(dataPath, JSON.stringify(superheroes, null, 2));

            res.status(200).json({ message: `You sent ${newName} and ${newUniverse}` });
        }
    } catch (error) {
        console.error('Error updating superheroes:', error);
        res.status(500).send('An error occurred while updating the superheroes.');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

//'users' to 'superheroes'
//'email' to 'universe'
//'/form' to '/heroForm