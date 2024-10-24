const express = require("express");
require('./config'); // MongoDB connection setup
const merch = require('./merch'); // Mongoose model
const upload = require('./function'); // Multer upload function
const path = require('path');

const app = express();
app.use(express.json());

// Serve static files for images (make merch_images accessible globally)
app.use('/merch_images', express.static(path.join(__dirname, 'merch_images')));

// List all merchandise items (fetch data with global image URLs)
app.get("/list", async (req, resp) => {
    try {
        // Dynamically generate the base URL for the images
        const baseUrl = `${req.protocol}://${req.get('host')}`;

        let data = await merch.find();
        // Modify image paths to be full URLs
        data = data.map(item => {
            item.images = item.images.map(imgPath => `${baseUrl}/${imgPath}`);
            return item;
        });

        resp.send(data);
    } catch (error) {
        console.error(error);
        resp.status(500).send("Error fetching merchandise.");
    }
});

// Create new merchandise with multiple image upload
app.post("/create", upload.array('merch_images', 5), async (req, resp) => {
    try {
        // Dynamically generate the base URL for the images
        const baseUrl = `${req.protocol}://${req.get('host')}`;

        // Get the image paths and convert them to full URLs
        const images = req.files.map(file => `${baseUrl}/merch_images/${file.filename}`);

        const data = new merch({
            name: req.body.name,
            images: images,  // Store full image URLs
            designBy: req.body.designBy,
            description: req.body.description,
            likes: req.body.likes || 0,
            cost: req.body.cost || 500,
        });

        const result = await data.save();
        console.log(result);
        resp.send(result);
    } catch (error) {
        console.error(error);
        resp.status(500).send("Error while creating merchandise.");
    }
});

// Update merchandise (only text fields, images cannot be changed)
app.put("/update/:_id", async (req, resp) => {
    try {
        let updatedFields = {
            name: req.body.name,
            description: req.body.description,
            cost: req.body.cost,
        };

        // Update the document
        let data = await merch.findByIdAndUpdate(
            req.params._id,
            { $set: updatedFields },
            { new: true }
        );
        resp.send(data);
    } catch (err) {
        resp.status(500).send({ error: "Error updating the merch item" });
    }
});

// Delete merchandise
app.delete("/delete/:_id", async (req, resp) => {
    try {
        let data = await merch.findByIdAndDelete(req.params._id);
        resp.send(data);
    } catch (error) {
        console.error(error);
        resp.status(500).send("Error deleting merchandise.");
    }
});

// Search merchandise by name
app.get("/search/:key", async (req, resp) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;

        let data = await merch.find({
            name: { $regex: req.params.key, $options: 'i' } // Case-insensitive search
        });

        // Modify image paths to be full URLs
        data = data.map(item => {
            item.images = item.images.map(imgPath => `${baseUrl}/${imgPath}`);
            return item;
        });

        resp.send(data);
    } catch (error) {
        console.error(error);
        resp.status(500).send("Error searching merchandise.");
    }
});

// Toggle like/unlike on a merch item
app.put("/like/:_id", async (req, resp) => {
    try {
        const userId = req.body.userId; // Assume the user's ID is sent in the request body

        // Find the merch item by ID
        const merchItem = await merch.findById(req.params._id);

        if (!merchItem) {
            return resp.status(404).send({ error: "Merch item not found" });
        }

        // Check if the user has already liked the merch
        const alreadyLiked = merchItem.likedBy.includes(userId);

        if (alreadyLiked) {
            // User wants to unlike the merch item
            merchItem.likes -= 1;
            merchItem.likedBy = merchItem.likedBy.filter(user => user !== userId); // Remove user from likedBy array
            message = "Merch item unliked successfully";
        } else {
            // User wants to like the merch item
            merchItem.likes += 1;
            merchItem.likedBy.push(userId); // Add user to likedBy array
            message = "Merch item liked successfully";
        }

        // Save the updated merch item
        await merchItem.save();

        resp.send({ message, merchItem });
    } catch (error) {
        console.error(error);
        resp.status(500).send({ error: "Error updating the like status" });
    }
});

// Start the server
app.listen(6000, () => {
    console.log("Server running on port 6000");
});
