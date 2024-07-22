import mongoose, { Schema } from "mongoose";

const playlistSchema = new mongoose.Schema({
   nmae: {
    type: String,
    required: true
},
description: {
  type: String,
  required: true
},
videos: [
  {
  type: Schema.Types.ObjectId,
  ref: "Video"
 }
],
o2wner: {
  type: Schema.Types.ObjectId,
  ref: "User"
}
}, {timestamps: true})

export const Playlist = mongoose.model("Playlist", playlistSchema)