const express = require("express");
const app = express();
const fs = require("fs");
const fileUpload = require("express-fileupload");

const secret_key = "YourSecretKey"; // The beautiful private key
const sharexdir = "image/"; // Your folder
const domain_url = "https://your.domain.name/"; // Your domain name
const lengthofstring = 7;
const port = 3000;


function randomString(length) {
  const keys = [...Array(10).keys()]
    .map((i) => i.toString())
    .concat([...Array(26).keys()].map((i) => String.fromCharCode(i + 97)));

  let key = "";
  for (let i = 0; i < length; i++) {
    key += keys[Math.floor(Math.random() * keys.length)];
  }
  return key;
}

app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Route to handle ShareX uploads
app.post("/upload", (req, res) => {
  if (req.body.secret) {
    if (req.body.secret === secret_key) {
      const filename = randomString(lengthofstring); // Generate random string for the file name
      const file = req.files.sharex; // Get the file from the request
      const fileType = file.name.split(".").pop(); // Get the file extension

      file.mv(`${sharexdir}${filename}.${fileType}`, (err) => {
        if (err) {
          return res
            .status(500)
            .send("File upload failed - CHMOD/Folder doesn't exist?"); // Not enought permission or the folder doesn't exist
        }
        res.send(`${domain_url}${sharexdir}${filename}.${fileType}`);
      });
    } else {
      res.send("Invalid Secret Key"); //You putted the wrong key in shareX config
    }
  } else {
    res.send("No post data received"); //You didn't put any key in shareX config
  }
});


//Route to handle GET request for downloading an image
app.get("/image/:name", (req, res) => {
  const name = req.params.name;
//Get all the files in the image folder
  const allImagesFiles = fs.readdirSync("./image");


  if (name.includes(".")) {
    if (allImagesFiles.includes(`${name}`)) {
      return res.sendFile(`./image/${name}`, {
        root: __dirname,
        headers: {
          "Content-Type": `image/${name.split(".")[1]}`,
          "Accept-Ranges": "bytes, bytes",
          "cache-control": "public, max-age=31536000",
          "x-content-type-options": "nosniff",
        },
      });
    } else {
      return res.status(404).send("Image not found"); //The image doesn't exist
    }
  }

  const allImages = allImagesFiles.map((file) => file.split(".")[0]);

  if (allImages.includes(`${name}`)) {
    // Find the file extension
    const fileExtension = allImagesFiles
      .find((file) => file.split(".")[0] === name)
      .split(".")[1];

    // Set the appropriate content type based on the file extension
    let contentType;
    switch (fileExtension.toLowerCase()) {
      case "gif":
        contentType = "image/gif";
        break;
      case "jpg":
      case "jpeg":
        contentType = "image/jpeg";
        break;
      case "png":
        contentType = "image/png";
        break;
      // Add more cases if needed for other image formats
      default:
        contentType = "application/octet-stream"; // default to binary data
    }

    // Send the file with appropriate content type
    return res.sendFile(`./image/${name}.${fileExtension}`, {
      root: __dirname,
      headers: {
        "Content-Type": contentType,
        "Accept-Ranges": "bytes, bytes",
        "cache-control": "public, max-age=31536000",
        "x-content-type-options": "nosniff",
      },
    });
  } else {
    return res.status(404).send("Image not found");
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
