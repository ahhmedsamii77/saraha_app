import mongoose from "mongoose";

export function checkConnectionDB() {
  mongoose.connect(process.env.DB_URL).then(_ => {
    console.log("success to connect db....................");
  }).catch(error => {
    console.log("fail to connect db....................", error);
  });
}