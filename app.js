const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const logger = require("morgan");
const redis = require("redis");

const app = express();

const client = redis.createClient();

client.on('connect', () => {
    console.log('redis server connected..')
})

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    const title = 'Task List';

    client.lrange('tasks', 0, -1, (err, reply) => {
        client.hgetall('call', (err, call) => {
            res.render("index", {
                title,
                tasks: reply,
                call,
            });
        });
    })
});

app.post("/task/add", (req, res) => {
    const task = req.body.task;

    client.rpush('tasks', task, (err, reply) => {
        if (err) {
            console.log(err);
        }
        console.log('Task Added');
        res.redirect('/');
    })
})

app.post('/task/delete', (req, res) => {
    const tasksToDel = req.body.tasks;

    client.lrange('tasks', 0, -1, (err, tasks) => {
        tasks.forEach((task, index) => {
            if (tasksToDel.indexOf(task) > -1) {
                client.lrem('tasks', 0, task, () => {
                    if (err) {
                        console.log(err);
                    }
                })
            }
        })
        res.redirect('/')
    })
})

app.post('/call/add', (req, res) => {
    let newCall = {};

    const { name, company, phone, time } = req.body;

    newCall.name = name;
    newCall.company = company;
    newCall.phone = phone;
    newCall.time = time;

    client.hmset('call', ['name', newCall.name, 'company', newCall.company, 'phone', newCall.phone, 'time', newCall.time], (err, reply) => {
        if (err) {
            console.log(err);
        }
        console.log(reply);

        res.redirect('/');
    })
});

app.listen(3000);
console.log("Server Started On Port 3000");

module.exports = app;
