# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 3

In **Stage Three** of the **Restaurant Reviews** projects, we are using asynchronous JavaScript to request JSON data from the API server, store data received from the server in an offline database using IndexedDB, which will create an app shell architecture. Finally, we are optimizing the app to meet performance benchmarks, which you’ll test using Lighthouse

### What do I do from here?

1. In this folder, start up a simple HTTP server to serve up the site files on your local computer. Python has some simple tools to do this, and you don't even need to know Python. For most people, it's already installed on your computer. 

In a terminal, check the version of Python you have: `python -V`. If you have Python 2.x, spin up the server with `python -m SimpleHTTPServer 8000` (or some other port, if port 8000 is already in use.) For Python 3.x, you can use `python3 -m http.server 8000`. If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the software.

2. With your server running, visit the site: `http://localhost:8000`, and look around for a bit to see what the current experience looks like.

3. To run the API server locally, head over to [this project](https://github.com/udacity/mws-restaurant-stage-3), clone the project, run `npm i` to install dependencies, and then run `npm i sails -g` to instal sails.js. Finally, run `node server` to spin up the server.



