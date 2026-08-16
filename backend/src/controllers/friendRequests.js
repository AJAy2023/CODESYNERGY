const FriendSchema = require("../models/friendSystem");
const User = require("../models/user");


const sendRequest = async (req, res) => {
  const { senderId, receiverId } = req.body;

  if (senderId === receiverId) {
    return res.status(400).json({ msg: "You can't send request to yourself" });
  }

  const existing = await FriendSchema.findOne({ 
    sender: senderId, 
    receiver: receiverId,
    status: { $in: ["pending", "accepted"] }
  });
  const reverse = await FriendSchema.findOne({ 
    sender: receiverId, 
    receiver: senderId,
    status: { $in: ["pending", "accepted"] }
  });

  if (existing || reverse) {
    return res.status(400).json({ msg: "Friend request already exists" });
  }

  const request = new FriendSchema({ sender: senderId, receiver: receiverId, status: "pending" });
  await request.save();

  if (req.io) {
    req.io.emit("friends:refresh");
  }

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

    // Update both users' friends arrays safely with ObjectId string checks
    const sender = await User.findById(request.sender);
    const receiver = await User.findById(request.receiver);

    if (sender && receiver) {
      const senderHasReceiver = sender.friends.some(id => String(id) === String(receiver._id));
      if (!senderHasReceiver) {
        sender.friends.push(receiver._id);
      }

      const receiverHasSender = receiver.friends.some(id => String(id) === String(sender._id));
      if (!receiverHasSender) {
        receiver.friends.push(sender._id);
      }

      await sender.save();
      await receiver.save();
    }

    if (req.io) {
      req.io.emit("friends:refresh");
    }

    res.status(200).json({ msg: "Friend request accepted", request });

  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};


const rejectRequest = async (req, res) => {
  const requestId = req.params.id;
  const request = await FriendSchema.findById(requestId);

  if (!request || request.status !== "pending") {
    return res.status(404).json({ msg: "Pending request not found" });
  }  

  request.status = "rejected";
  await request.save();

  if (req.io) {
    req.io.emit("friends:refresh");
  }

  res.status(200).json({ msg: "Friend request rejected", request });
};


const getFriendList = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).populate("friends", "username profilePic email");

    const acceptedFriends = await FriendSchema.find({
      $or: [{ sender: userId }, { receiver: userId }],
      status: "accepted"
    }).populate("sender receiver", "username profilePic email");

    const schemaFriends = acceptedFriends
      .filter(f => f.sender && f.receiver)
      .map(f => String(f.sender._id || f.sender) === String(userId) ? f.receiver : f.sender);

    const combinedMap = new Map();
    if (user && Array.isArray(user.friends)) {
      user.friends.forEach(f => {
        if (f && f._id) combinedMap.set(String(f._id), f);
      });
    }
    schemaFriends.forEach(f => {
      if (f && f._id) combinedMap.set(String(f._id), f);
    });

    const friends = Array.from(combinedMap.values());
    res.status(200).json({ msg: "Friend list fetched successfully", friends });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};


// delete the friend request  
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

    await User.findByIdAndUpdate(userId1, { $pull: { friends: userId2 } });
    await User.findByIdAndUpdate(userId2, { $pull: { friends: userId1 } });

    if (req.io) {
      req.io.emit("friends:refresh");
    }

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

    if (req.io) {
      req.io.emit("friends:refresh");
    }

    return res.status(200).json({ msg: "Friend request canceled successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

const getFriendStatus = async (req, res) => {
  try {
    const currentUserId = req.user?.id || req.user?._id; 
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
