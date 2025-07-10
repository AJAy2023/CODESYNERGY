const FriendSchema = require("../models/friendSystem");
const User = require("../models/user");


const sendRequest = async (req, res) => {
  const { senderId, receiverId } = req.body;

  if (senderId === receiverId) {
    return res.status(400).json({ msg: "You can't send request to yourself" });
  }

  const existing = await FriendSchema.findOne({ 
    sender: senderId, 
    receiver:receiverId ,
    status: { $in: ["pending", "accepted"] }
  });
  const reverse = await FriendSchema.findOne({ sender: receiverId, receiver: senderId,
    status: { $in: ["pending", "accepted"] }
   });

  if (existing || reverse) {
    return res.status(400).json({ msg: "Friend request already exists" });
  }

  const request = new FriendSchema({ sender: senderId, receiver: receiverId, status: "pending" });
  await request.save();

  res.status(200).json({ msg: "Friend request sent", request });
};


const acceptRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const request = await FriendSchema.findById(requestId);

    if (!request || request.status !== "pending") {
      return res.status(404).json({ msg: "Pending request not found" });
    }

    // Update the request
    request.status = "accepted";
    await request.save();

    // Update both users' friends arrays
    const sender = await User.findById(request.sender);
    const receiver = await User.findById(request.receiver);

    if (sender && receiver) {
      if (!sender.friends.includes(receiver._id)) {
        sender.friends.push(receiver._id);
      }
      if (!receiver.friends.includes(sender._id)) {
        receiver.friends.push(sender._id);
      }

      await sender.save();
      await receiver.save();
    }

    res.status(200).json({ msg: "Friend request accepted", request });

  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};


const rejectRequest = async (req, res) => {
  const requestId = req.params.id;
  console.log("the requested  id :" , requestId);
  const request = await FriendSchema.findById(requestId);
console.log("the request found  from the  friendschema : ", request);

  if (!request || request.status !== "pending") {
    return res.status(404).json({ msg: "Pending request not found" });
  }  

  request.status = "rejected";
  await request.save();

  res.status(200).json({ msg: "Friend request rejected", request });
};


const getFriendList = async (req, res) => {
  const userId = req.params.userId;

  const acceptedFriends = await FriendSchema.find({
    $or: [{ sender: userId }, { receiver: userId }],
    status: "accepted"
  }).populate("sender receiver", "username profilePic");

  const friends = acceptedFriends.map(f =>
    f.sender._id.toString() === userId ? f.receiver : f.sender
  );

  res.status(200).json({ msg: "Friend list fetched successfully",  friends:  friends});
};


// delete the frined request  
const unfriend = async (req, res) => {
  try {
    const { userId1, userId2 } = req.body;
   
    const friendship = await FriendSchema.findOne({
      $or: [
        { sender: userId1, receiver: userId2 },
        { sender: userId2, receiver: userId1 }
      ],
      status: "accepted"
    });

    if (!friendship) {
      return res.status(404).json({ msg: "Friendship not found" });
    }
    friendship.status = "removed";
    await friendship.save();

    return res.status(200).json({ msg: "Friend removed successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};


module.exports = {
  sendRequest,
  acceptRequest,
  rejectRequest,
  getFriendList,
  unfriend
};
