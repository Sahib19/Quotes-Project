const express = require("express");
const app = express();
const port = 8080;

// File system for database persistence
const fs = require("fs");
const path = require("path");

// to set where to find the views files
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//Where to find the static files like css
app.use(express.static(path.join(__dirname, "public")));

// to override the exiting post to delete or patch
const methodOverride = require('method-override');
app.use(methodOverride(('_method')));

//Creating unique id's
const { v4: uuidv4 } = require('uuid');

// from se send kiya data smj paye
app.use(express.urlencoded({ extended: true }));

// Data file paths
const POSTS_FILE = path.join(__dirname, "data", "posts.json");
const CONTACTS_FILE = path.join(__dirname, "data", "contacts.json");

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, "data"))) {
    fs.mkdirSync(path.join(__dirname, "data"), { recursive: true });
}

// Helper function to read posts from file
function readPosts() {
    try {
        if (fs.existsSync(POSTS_FILE)) {
            const data = fs.readFileSync(POSTS_FILE, "utf8");
            return JSON.parse(data);
        }
    } catch (error) {
        console.error("Error reading posts:", error);
    }
    // Return default posts if file doesn't exist or error occurs
    return [
        {
            id: uuidv4(),
            username: "Sahib",
            shayri: "Life may knock you down, but every fall is a setup for a stronger comeback. Keep rising!"
        },
        {
            id: uuidv4(),
            username: "Sumit Rajput",
            shayri: "You were not born to give up. Even the darkest night ends with sunrise."
        },
        {
            id: uuidv4(),
            username: "Adit",
            shayri: "Success is built one step at a time. Don't stop just because it's hard — that's when it matters most."
        },
        {
            id: uuidv4(),
            username: "Ansh",
            shayri: "Your journey is yours alone. Don't let others dim the fire you're meant to ignite."
        }
    ];
}

// Helper function to save posts to file
function savePosts(posts) {
    try {
        fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), "utf8");
    } catch (error) {
        console.error("Error saving posts:", error);
        throw error;
    }
}

// Helper function to save contact submission
function saveContact(contact) {
    try {
        let contacts = [];
        if (fs.existsSync(CONTACTS_FILE)) {
            const data = fs.readFileSync(CONTACTS_FILE, "utf8");
            contacts = JSON.parse(data);
        }
        contacts.push({
            ...contact,
            id: uuidv4(),
            timestamp: new Date().toISOString()
        });
        fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2), "utf8");
    } catch (error) {
        console.error("Error saving contact:", error);
        throw error;
    }
}

// Input validation and sanitization
function validatePost(username, shayri) {
    const errors = [];
    
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
        errors.push("Username is required");
    } else if (username.trim().length > 50) {
        errors.push("Username must be less than 50 characters");
    }
    
    if (!shayri || typeof shayri !== 'string' || shayri.trim().length === 0) {
        errors.push("Quote/Shayri is required");
    } else if (shayri.trim().length < 10) {
        errors.push("Quote/Shayri must be at least 10 characters long");
    } else if (shayri.trim().length > 500) {
        errors.push("Quote/Shayri must be less than 500 characters");
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        data: {
            username: username ? username.trim() : "",
            shayri: shayri ? shayri.trim() : ""
        }
    };
}

function validateContact(name, email, message) {
    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        errors.push("Name is required");
    } else if (name.trim().length > 100) {
        errors.push("Name must be less than 100 characters");
    }
    
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
        errors.push("Email is required");
    } else if (!emailRegex.test(email.trim())) {
        errors.push("Invalid email format");
    }
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        errors.push("Message is required");
    } else if (message.trim().length > 1000) {
        errors.push("Message must be less than 1000 characters");
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        data: {
            name: name ? name.trim() : "",
            email: email ? email.trim() : "",
            message: message ? message.trim() : ""
        }
    };
}

// Initialize posts from file
let posts = readPosts();
// Save initial posts if file doesn't exist
if (!fs.existsSync(POSTS_FILE)) {
    savePosts(posts);
}

// Root route - redirect to posts
app.get("/", (req, res) => {
    res.redirect("/posts");
});

// this will render all the pages
app.get("/posts", (req, res) => {
    try {
        posts = readPosts();
        res.render("index.ejs", { posts });
    } catch (error) {
        console.error("Error loading posts:", error);
        res.status(500).render("error.ejs", { 
            message: "Error loading posts. Please try again later.",
            error: error.message 
        });
    }
});

// it will render the new form to submit the new quote
app.get("/posts/new", (req, res) => {
    res.render("form.ejs", { errors: null, formData: null });
});

// to listen the request (post) send by the form
app.post("/posts", (req, res) => {
    try {
        const { username, shayri } = req.body;
        const validation = validatePost(username, shayri);
        
        if (!validation.isValid) {
            return res.render("form.ejs", { 
                errors: validation.errors, 
                formData: { username, shayri } 
            });
        }
        
        const id = uuidv4();
        const newPost = { 
            id, 
            username: validation.data.username, 
            shayri: validation.data.shayri 
        };
        
        posts = readPosts();
        posts.push(newPost);
        savePosts(posts);
        
        res.redirect("/posts");
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).render("error.ejs", { 
            message: "Error creating post. Please try again.",
            error: error.message 
        });
    }
});

// to listen the edit request send by the edit button and then render a edit form
app.get("/posts/edit/:id", (req, res) => {
    try {
        const { id } = req.params;
        posts = readPosts();
        const post = posts.find((p) => id === p.id);
        
        if (!post) {
            return res.status(404).render("error.ejs", { 
                message: "Post not found",
                error: "The post you're looking for doesn't exist."
            });
        }
        
        res.render("editForm.ejs", { post, errors: null });
    } catch (error) {
        console.error("Error loading post for edit:", error);
        res.status(500).render("error.ejs", { 
            message: "Error loading post. Please try again.",
            error: error.message 
        });
    }
});

// to accept request send by form to update the existing shayri
app.patch("/posts/:id", (req, res) => {
    try {
        const { id } = req.params;
        const { shayri } = req.body;
        
        const validation = validatePost("temp", shayri); // Username not validated for edit
        if (!validation.isValid) {
            posts = readPosts();
            const post = posts.find((p) => id === p.id);
            if (!post) {
                return res.status(404).render("error.ejs", { 
                    message: "Post not found",
                    error: "The post you're looking for doesn't exist."
                });
            }
            return res.render("editForm.ejs", { 
                post, 
                errors: validation.errors.filter(e => !e.includes("Username")) 
            });
        }
        
        posts = readPosts();
        const post = posts.find((p) => id === p.id);
        
        if (!post) {
            return res.status(404).render("error.ejs", { 
                message: "Post not found",
                error: "The post you're looking for doesn't exist."
            });
        }
        
        post.shayri = validation.data.shayri;
        savePosts(posts);
        
        res.redirect("/posts");
    } catch (error) {
        console.error("Error updating post:", error);
        res.status(500).render("error.ejs", { 
            message: "Error updating post. Please try again.",
            error: error.message 
        });
    }
});

//to delete a post 
app.delete("/posts/:id", (req, res) => {
    try {
        const { id } = req.params;
        posts = readPosts();
        const initialLength = posts.length;
        posts = posts.filter(post => post.id !== id);
        
        if (posts.length === initialLength) {
            return res.status(404).render("error.ejs", { 
                message: "Post not found",
                error: "The post you're trying to delete doesn't exist."
            });
        }
        
        savePosts(posts);
        res.redirect("/posts");
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).render("error.ejs", { 
            message: "Error deleting post. Please try again.",
            error: error.message 
        });
    }
});

// functionality of view button
app.get("/posts/show/:id", (req, res) => {
    try {
        const { id } = req.params;
        posts = readPosts();
        const post = posts.find((p) => id === p.id);
        
        if (!post) {
            return res.status(404).render("error.ejs", { 
                message: "Post not found",
                error: "The post you're looking for doesn't exist."
            });
        }
        
        res.render("view.ejs", { post });
    } catch (error) {
        console.error("Error loading post:", error);
        res.status(500).render("error.ejs", { 
            message: "Error loading post. Please try again.",
            error: error.message 
        });
    }
});

// back request after view button functionality
app.get("/posts/back", (req, res) => {
    res.redirect("/posts");
});

//contact request
app.get("/posts/contact", (req, res) => {
    res.render("contact.ejs", { errors: null, formData: null });
});

//response to contact us 
app.post("/contact", (req, res) => {
    try {
        const { name, email, message } = req.body;
        const validation = validateContact(name, email, message);
        
        if (!validation.isValid) {
            return res.render("contact.ejs", { 
                errors: validation.errors, 
                formData: { name, email, message } 
            });
        }
        
        saveContact(validation.data);
        
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Thank You</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        text-align: center;
                        margin-top: 100px;
                        background-color: #f0f0f0;
                    }
                    .container {
                        max-width: 500px;
                        margin: 0 auto;
                        padding: 40px;
                        background: white;
                        border-radius: 10px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    h2 {
                        color: #27ae60;
                        margin-bottom: 20px;
                    }
                    #timer {
                        font-weight: bold;
                        color: #3498db;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>✓ Thanks for Contacting us!</h2>
                    <p>We'll get back to you soon.</p>
                    <p>Redirecting to Posts page in <span id="timer">3</span> seconds...</p>
                    <script>
                        let timeLeft = 3;
                        const timerEl = document.getElementById("timer");
                        const countdown = setInterval(() => {
                            timeLeft--;
                            timerEl.textContent = timeLeft;
                            if (timeLeft === 0) {
                                clearInterval(countdown);
                                window.location.href = "/posts";
                            }
                        }, 1000);
                    </script>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        console.error("Error processing contact:", error);
        res.status(500).render("error.ejs", { 
            message: "Error sending message. Please try again.",
            error: error.message 
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).render("error.ejs", { 
        message: "Page Not Found",
        error: "The page you're looking for doesn't exist."
    });
});

// Error handler middleware
app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).render("error.ejs", { 
        message: "Internal Server Error",
        error: process.env.NODE_ENV === 'development' ? err.message : "Something went wrong."
    });
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
    console.log(`Visit http://localhost:${port} to view the application`);
});
