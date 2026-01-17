# ITG Pause Ads

## Running Locally

To run the preview page locally, you need to serve the `docs` folder with a web server to avoid CORS issues.

### Start the local server:

```bash
cd docs && python3 -m http.server 8000
```

Then open your browser and navigate to:

```
http://localhost:8000
```

### Stop the server:

Press `Ctrl+C` in the terminal, or if the port is already in use, kill the process:

```bash
lsof -ti:8000 | xargs kill -9
```
