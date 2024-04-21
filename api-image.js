const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const axios = require("axios");
const { promisify } = require("util");
const readdirAsync = promisify(fs.readdir);
const { getInstaData } = require("./main");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");

const secret_key = "1234"; // The beautiful private key
const sharexdir = "image/"; // Your folder
const domain_url = "https://cdn.discords.ca/"; // Your domain name
const lengthofstring = 7;

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

async function getImageTypeFromBuffer(url) {
  try {
    const response = await axios.get(url);
    const coneType = response.headers["content-type"];
    console.log(coneType);
    if (coneType.includes("image")) {
      return coneType.split("/")[1];
    } else {
      return null;
    }
  } catch (error) {
    return console.error("Error downloading image:", error.message);
  }
}

app.get("/image", async (req, res) => {
  const name = req.query.name;
  const urlString = req._parsedUrl.search;
  console.log(urlString);

  const httpIndex = urlString.indexOf("http");
  let url;

  // If 'http' is found, extract everything after it
  if (httpIndex !== -1) {
    url = urlString.substring(httpIndex);
  } else {
    console.log("No 'http' found in the URL string.");
    return res.status(400).send("Invalid URL");
  }

  try {
    // Transform the URL to a base64 string
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const urlBuffer = Buffer.from(response.data, "binary").toString("base64");

    // Check if the image is a GIF
    const imageType = await getImageTypeFromBuffer(url);
    if (!imageType) {
      return res.status(400).send("Unknown image type");
    }

    if (imageType !== "gif") {
      // If it's not a GIF, process it as a static image
      const buffer = Buffer.from(urlBuffer, "base64");
      const image = sharp(buffer);

      const allImagesFiles = await readdirAsync("./image");
      const allImages = allImagesFiles.map((file) => file.split(".")[0]);

      if (allImages.includes(`${name}`)) {
        return res.status(409).send("Image name already used");
      }

      await image.toFile(`./image/${name}.${imageType}`, (err) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error saving the image");
        } else {
          res.send(`Image ${name} uploaded successfully`);
        }
      });
    } else {
      // If it's a GIF, save it directly
      const gifBuffer = Buffer.from(urlBuffer, "base64");
      fs.writeFile(`./image/${name}.gif`, gifBuffer, (err) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error saving the GIF");
        } else {
          res.send(`GIF ${name} uploaded successfully`);
        }
      });
    }
  } catch (error) {
    console.error("Error downloading image:", error.message);
    res.status(500).send("Error downloading the image");
  }
});

app.post("/upload", (req, res) => {
  if (req.body.secret) {
    if (req.body.secret === secret_key) {
      const filename = randomString(lengthofstring);
      const file = req.files.sharex;
      const fileType = file.name.split(".").pop();

      file.mv(`${sharexdir}${filename}.${fileType}`, (err) => {
        if (err) {
          return res
            .status(500)
            .send("File upload failed - CHMOD/Folder doesn't exist?");
        }
        res.send(`${domain_url}${filename}.${fileType}`);
      });
    } else {
      res.send("Invalid Secret Key");
    }
  } else {
    res.send("No post data received");
  }
});
app.get("/image/:name/:url", (req, res) => {
  const name = req.params.name;
  let imageBuffer;
  try {
    imageBuffer = Buffer.from(url, "base64");
  } catch (error) {
    console.error("Error decoding base64 string:", error);
    return res.status(400).send("Invalid base64 string");
  }
  const allImage = fs.readdirSync("./image");
  // Check if the image file already exists
  if (allImage.includes(`${name}.jpg`)) {
    return res.status(409).send("Image name already used");
  }

  fs.writeFile(`./image/${name}.jpg`, imageBuffer, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error saving the image");
    } else {
      res.send(`Image ${name} uploaded successfully`);
    }
  });
});

// Route to handle GET request for downloading an image
app.get("/image/:name", (req, res) => {
  const name = req.params.name;

  const allImagesFiles = fs.readdirSync("./image");

  // check if the name already contain the extension
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
      return res.status(404).send("Image not found");
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
