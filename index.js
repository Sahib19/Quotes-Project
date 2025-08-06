const express = require("express");
const app = express();
const port = 8080;

// to set where to find the views files
const path = require("path");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//Where to find the static files like css
app.use(express.static(path.join(__dirname, "public")));

// to override the exiting post to delete or patch
const methodOverride = require('method-override');
app.use(methodOverride(('_method')));

//Creating unique id's
const { v4: uuidv4 } = require('uuid'); //uuidv4()

// from se send kiya data smj paye
app.use(express.urlencoded({ extended: true }));

//DataBase Replica
let posts = [
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
        shayri: "Success is built one step at a time. Don\'t stop just because it\'s hard — that\'s when it matters most."


    }
    ,
    {
        id: uuidv4(),
        username: "Ansh",
        shayri: "Your journey is yours alone. Don\'t let others dim the fire you\'re meant to ignite."


    }

]


// this will render all the pages
app.get("/posts", (req, res) => {
    // console.log(posts);
    res.render("index.ejs", { posts });
})

// it will render the new form to submit the new quote
app.get("/posts/new", (req, res) => {
    res.render("form.ejs")
})

// to listen the request (post) send by the form
app.post("/posts", (req, res) => {
    let { username, shayri } = req.body;
    let id = uuidv4();
    posts.push({ id, username, shayri });
    res.redirect("/posts");
})

// to listen the edit request send by the edit button and then render a edit form
app.get("/posts/edit/:id", (req, res) => {
    let { id } = req.params;
    let post = posts.find((p) => id === p.id);
    res.render("editForm.ejs", { post });
})

// to accept request send by fomr to upadate the exisiting shayri
app.patch("/posts/:id", (req, res) => {
    let { id } = req.params;
    let newshayri = req.body.shayri;
    let post = posts.find((p) => id === p.id);
    post.shayri = newshayri;
    res.redirect("/posts");
})

//to delete a post 
app.delete("/posts/:id", (req, res) => {
    let { id } = req.params;
    // let post = posts.find((p)=> id == p.id);
    posts = posts.filter(post => post.id != id);
    res.redirect("/posts");

})
// funcitonality of view button
app.get("/posts/show/:id", (req, res) => {
    let { id } = req.params;
    let post = posts.find((p) => id === p.id);
    console.log(post);
    res.render("view.ejs", { post });
})

// back reuqest aftre view button functionality
app.get("/posts/back", (req, res) => {
    res.redirect("/posts");
})

//contatc request
app.get("/posts/contact", (req, res) => {
    res.render("contact.ejs");
})

//response to contact us 
app.post("/contact", (req, res) => {
    res.send(`
        <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 100px;">
            <h2>Thanks for Contacting us ............</h2>
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
    `);
});



app.listen(port, () => {
    console.log("Server is listening");
})