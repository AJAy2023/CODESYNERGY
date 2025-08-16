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

// get friend through the  search  

const searchquery = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ msg: "Search query is required" });
    }

    const users = await User.find({
      username: { $regex: query, $options: "i" }
    }).select("username profilePic");

    res.status(200).json({ msg: "Users fetched successfully", users });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};




const incomingRequests = async (req, res) => {
  try {
    const userId = req.params.userId;

    const requests = await FriendSchema.find({
      receiver: userId,
      status: "pending"
    })
    .populate("sender", "username profilePic");

    return res.status(200).json({ 
      msg: "Incoming friend requests fetched successfully", 
      requests 
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

const outgoingRequests = async (req, res) => {
  try {
    const userId = req.params.userId;

    const requests = await FriendSchema.find({
      sender: userId,
      status: "pending"
    })
    .populate("receiver", "username profilePic");

    return res.status(200).json({ 
      msg: "Outgoing friend requests fetched successfully", 
      requests 
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

const cancelRequest = async (req, res) => {
  try {
    const requestId = req.params.id;

    const request = await FriendSchema.findById(requestId);
    if (!request || request.status !== "pending") {
      return res.status(404).json({ msg: "Pending request not found" });
    }

    await FriendSchema.findByIdAndDelete(requestId);

    return res.status(200).json({ msg: "Friend request canceled successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

//get the  status 
const getFriendStatus = async (req, res) => {
  try {
    const currentUserId = req.user.id; 
    const otherUserId = req.params.userId;

  
    const areFriends = await FriendSchema.findOne({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ],
      status: "accepted"
    });

    if (areFriends) {
      return res.json({ status: "friends" });
    }

  
    const outgoing = await FriendSchema.findOne({
      sender: currentUserId,
      receiver: otherUserId,
      status: "pending"
    });

    if (outgoing) {
      return res.json({ status: "pending" });
    }

   
    const incoming = await FriendSchema.findOne({
      sender: otherUserId,
      receiver: currentUserId,
      status: "pending"
    });

    if (incoming) {
      return res.json({ status: "incoming" });
    }


    return res.json({ status: "none" });

  } catch (err) {
    console.error("Error checking friend status:", err);
    return res.status(500).json({ error: "Server error" });
  }
};


module.exports = {
  sendRequest,
  acceptRequest,
  rejectRequest,
  getFriendList,
  unfriend,
  searchquery,
  incomingRequests,
  outgoingRequests,
  cancelRequest,
  getFriendStatus
};
