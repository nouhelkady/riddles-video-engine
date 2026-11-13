# riddles-video-engine

Turns an episode description (riddles + pictures) into a finished 16:9 riddles video:
a red title banner, numbered choices over the picture, a countdown clock that ticks once
per second, then the answer highlighted.

It is driven by an n8n workflow: n8n reads the script, generates the pictures, saves an
`episode.json` on Google Drive and starts the **Render riddles video** action here. When the
video is ready the action publishes it as a release and calls n8n back.

## episode.json

```json
{
  "thinkSeconds": 20,
  "revealSeconds": 5,
  "segments": [
    {"type": "intro", "title": "...", "subtitle": "..."},
    {"type": "level", "title": "المستوى السهل"},
    {"type": "riddle", "kind": "image", "n": 1, "title": "من أكل الكعكة؟",
     "imageFileId": "<Drive id>", "options": 4, "answer": 3, "clue": "...", "reveal": true},
    {"type": "riddle", "kind": "emojiGrid", "n": 2, "title": "أوجد الرمز المكرر", "reveal": true},
    {"type": "riddle", "kind": "text", "n": 3, "title": "...", "text": "...", "reveal": false},
    {"type": "outro", "title": "...", "subtitle": "..."}
  ]
}
```

Pictures must be shared on Drive as "anyone with the link". For image riddles the people or
objects should stand side by side in one row, evenly spaced, with no text in the picture:
the numbers are drawn by the engine.

## Local preview

```
npm install
npm run studio
```
