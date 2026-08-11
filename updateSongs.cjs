const fs = require('fs');

const fileContent = fs.readFileSync('src/data/songs.js', 'utf8');

let newContent = fileContent.replace(/youtubeId: (.*?),/g, 'youtubeId: $1,\n    embeddable: true,');

// Replace the first song's youtube ID with a known embeddable one
newContent = newContent.replace('youtubeId: "TFr6G5zveS8",', 'youtubeId: "dQw4w9WgXcQ",');
newContent = newContent.replace('title: "Lag Ja Gale"', 'title: "Lag Ja Gale (Embed Test)"');

fs.writeFileSync('src/data/songs.js', newContent);
console.log("Updated songs.js");
