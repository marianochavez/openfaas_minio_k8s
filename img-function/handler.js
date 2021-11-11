const mongoose = require("mongoose");
const uri = "";

mongoose.connect(uri);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Connected to MongoDB");
});

const ImageSchema = new mongoose.Schema(
  {
    bucket: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

const Image = mongoose.model("Image", ImageSchema);

module.exports = async (event, context) => {
  console.log(event.body);

  switch (event.body.EventName) {
    case "s3:ObjectCreated:Put":
      const image = new Image({
        bucket: event.body.Records[0].s3.bucket.name,
        key: event.body.Records[0].s3.object.key,
        createdAt: event.body.Records[0].eventTime,
      });
      try {
        if (
          (await Image.findOne({ key: event.body.Records[0].s3.object.key })) ==
          null
        ) {
          await image.save();
          console.log("Image saved");
        } else {
          console.log("Image already exist");
        }
      } catch (err) {
        console.log(err);
      }
      break;
    case "s3:ObjectRemoved:Delete":
      try {
        if (await Image.findOne({ key: event.body.Records[0].s3.object.key })) {
          await Image.findOneAndDelete({
            key: event.body.Records[0].s3.object.key,
          });
          console.log("Image deleted");
        } else {
          console.log("Image not found");
        }
      } catch (err) {
        console.log(err);
      }
      break;
    default:
      console.log("Unsupported method");
  }
};
