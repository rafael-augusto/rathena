# Mob Comparator & Detail Viewer

This tool allows you to compare Pre-Renewal and Renewal mob stats and view detailed information for each mob, including drops and images.

## Setup

1.  Ensure you have Python installed.
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## Downloading Mob GIFs

Before using the detail view, you should download the mob images.
Run the following command from the `mob_comparator` directory:

```bash
python download_gifs.py
```
(Or `py download_gifs.py` on Windows if `python` doesn't work)

This will download all mob GIFs to `static/mob_gifs/`. This may take a while as there are thousands of mobs.

## Downloading Item Images & Descriptions

To download item images and update the item database with descriptions from RateMyServer:

```bash
python download_items.py
```

This will:
1.  Scan the item YAML files in `../db/pre-re/`.
2.  Download small and large item images to `static/items/`.
3.  Fetch item descriptions from RateMyServer.
4.  Insert the `Description` field into the YAML files.

**Note:** This modifies your YAML database files. Back them up if necessary.

## Running the App

Run the Flask application:

```bash
python app.py
```

Then open your browser to `http://127.0.0.1:5000`.
Select a mob from the dropdown to compare stats, and click "View Full Details" to see the detail page with drops and the image.
