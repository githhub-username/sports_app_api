const express = require("express");
const path = require("path"); // To handle file paths
const fs = require('fs'); // To manage file system operations
require('./config'); // Configuration (like DB connection)
const merch = require('./merch'); // Import merchandise model
const upload = require('./function'); // Import file upload logic

const app = express();
app.use(express.json());

// Create merch_images directory if it doesn't exist
const imageDirectory = path.join(__dirname, 'merch_images');
if (!fs.existsSync(imageDirectory)) {
    fs.mkdirSync(imageDirectory, { recursive: true });
}

// Serve static files (images) from the merch_images directory
app.use('/merch_images', express.static(imageDirectory));

// List all merchandise items
app.get("/list", async (req, resp) => {
    let data = await merch.find();
    
    // Generate full URLs for images
    const formattedData = data.map(item => ({
        ...item.toObject(),
        images: item.images.map(image => `${req.protocol}://${req.get('host')}/merch_images/${image}`)
    }));

    resp.send(formattedData);
});

// Create new merchandise with multiple image upload
app.post("/create", upload.array('merch_images', 5), async (req, resp) => {
    try {
        const images = req.files.map(file => file.filename); // Get filenames without the path

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
        resp.send({
            ...result.toObject(),
            images: images.map(image => `${req.protocol}://${req.get('host')}/merch_images/${image}`) // Full URLs
        });
    } catch (error) {
        console.error(error);
        resp.status(500).send("Error while creating merchandise.");
    }
});

// Update merchandise details and handle image replacement
app.put("/update/:_id", upload.array('merch_images', 5), async (req, resp) => {
    try {
        let updatedFields = { ...req.body };

        // Fetch the current merch item to delete old images
        const merchItem = await merch.findById(req.params._id);
        if (!merchItem) {
            return resp.status(404).send({ error: "Merch item not found" });
        }

        // Check if files were uploaded
        if (req.files && req.files.length > 0) {
            if (merchItem.images && merchItem.images.length > 0) {
                // Delete the old images from the server
                merchItem.images.forEach(image => {
                    const imagePath = path.join(imageDirectory, path.basename(image));
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath); // Remove the old image file
                    }
                });
            }

            // Upload new images
            const imagePaths = req.files.map(file => file.filename); // Get filenames
            updatedFields.images = imagePaths.map(image => `${req.protocol}://${req.get('host')}/merch_images/${image}`); // Generate full URLs
        }

        // Update the document
        let data = await merch.findByIdAndUpdate(
            req.params._id,
            { $set: updatedFields },
            { new: true }
        );

        // Re-fetch the updated item
        const updatedItem = await merch.findById(data._id);
        const formattedItem = {
            ...updatedItem.toObject(),
            images: updatedItem.images.map(image => `${req.protocol}://${req.get('host')}/merch_images/${image}`)
        };

        resp.send(formattedItem);
    } catch (err) {
        console.error(err);
        resp.status(500).send({ error: "Error updating the merch item" });
    }
});

// Delete merchandise
app.delete("/delete/:_id", async (req, resp) => {
    try {
        const merchItem = await merch.findById(req.params._id);
        if (merchItem && merchItem.images.length > 0) {
            // Delete all images related to the merch
            merchItem.images.forEach(image => {
                const imagePath = path.join(imageDirectory, path.basename(image));
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath); // Remove the old image file
                }
            });
        }

        // Delete merch item from the database
        const data = await merch.deleteOne({ _id: req.params._id });
        resp.send(data);
    } catch (error) {
        console.error(error);
        resp.status(500).send({ error: "Error deleting the merch item" });
    }
});

// Search merchandise by name
app.get("/search/:key", async (req, resp) => {
    let data = await merch.find({
        "$or": [
            { "name": { $regex: req.params.key, $options: 'i' } }, // Case-insensitive search
        ]
    });

    // Format image URLs
    const formattedData = data.map(item => ({
        ...item.toObject(),
        images: item.images.map(image => `${req.protocol}://${req.get('host')}/merch_images/${image}`)
    }));

    resp.send(formattedData);
});

// Route to handle toggling like/unlike on a merch item
app.put("/like/:_id", async (req, resp) => {
    try {
        const userId = req.body.userId; // Assume the user's ID is sent in the request body
        const merchItem = await merch.findById(req.params._id);

        if (!merchItem) {
            return resp.status(404).send({ error: "Merch item not found" });
        }

        const alreadyLiked = merchItem.likedBy.includes(userId);

        if (alreadyLiked) {
            // User wants to unlike the merch item
            merchItem.likes -= 1;
            merchItem.likedBy = merchItem.likedBy.filter(user => user !== userId);
            message = "Merch item unliked successfully";
        } else {
            // User wants to like the merch item
            merchItem.likes += 1;
            merchItem.likedBy.push(userId);
            message = "Merch item liked successfully";
        }

        await merchItem.save();
        resp.send({ message, merchItem });
    } catch (error) {
        console.error(error);
        resp.status(500).send({ error: "Error updating the like status" });
    }
});

// Start the server
const PORT = process.env.PORT || 6000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
