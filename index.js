// Server setup (server.js)
const express = require("express");
require('./config');
const merch = require('./merch');
const upload = require('./function');

const app = express();
app.use(express.json());

// List all merchandise items
app.get("/list", async (req, resp) => {
    let data = await merch.find();
    resp.send(data);
});

// Create new merchandise with multiple image upload
// Create new merchandise with multiple image upload
app.post("/create", upload.array('merch_images', 5), async (req, resp) => {
    try {
        const images = req.files.map(file => file.path); // Get file paths

        const data = new merch({
            name: req.body.name,
            images: images,
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


app.put("/update/:_id", upload.array('merch_images', 5), async (req, resp) => {
    try {
        let updatedFields = { ...req.body };
        
        // If files are uploaded, update the images field
        if (req.files && req.files.length > 0) {
            const imagePaths = req.files.map(file => file.path);
            updatedFields.images = imagePaths;
        }

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
    console.log(req.params);
    let data = await merch.deleteOne(req.params);
    resp.send(data);
})

// Search merchandise by name
app.get("/search/:key", async (req, resp) => {
    console.log(req.params.key);
    let data = await merch.find(
        {
            "$or": [
                {"name": {$regex: req.params.key, $options: 'i'}}, // Case-insensitive search
            ]
        }
    );
    resp.send(data);
})

// Route to handle toggling like/unlike on a merch item
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


app.listen(6000, () => {
    console.log("Server running on port 6000");
});
