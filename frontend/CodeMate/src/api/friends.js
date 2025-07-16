// import { BASE_URL } from "../api/config";

// export const searchUsers = async (query) =>
//   axios.get(`/users/search?query=${query}`);

// export const sendFriendRequest = async (senderId, receiverId) =>
//   axios.post("/friends/send", { senderId, receiverId });





// export const sendFriendRequest = (senderId, receiverId) =>
//   axios.post("/friends/send", { senderId, receiverId });

// export const acceptFriendRequest = (id, body) =>
//   axios.post(`/friends/accept/${id}`, body);

// export const rejectFriendRequest = (id, body) =>
//   axios.post(`/friends/reject/${id}`, body);

// export const deleteFriend = (userId1, userId2) =>
//   axios.post("/friends/delete", { userId1, userId2 });

// Others as needed



// ✅ File: src/api/friends.js

// import axios from "axios";
// import { BASE_URL } from "./config";

// const token = localStorage.getItem("token");

// const headers = {
//   Authorization: `Bearer ${token}`,
// };

// export const sendFriendRequest = async (senderId, receiverId) => {
//   return axios.post(`${BASE_URL}/friends/send`, { senderId, receiverId }, { headers });
// };

// export const acceptFriendRequest = async (requestId) => {
//   return axios.post(`${BASE_URL}/friends/accept/${requestId}`, {}, { headers });
// };

// export const rejectFriendRequest = async (requestId) => {
//   return axios.post(`${BASE_URL}/friends/reject/${requestId}`, {}, { headers });
// };

// export const getFriendList = async (userId) => {
//   return axios.get(`${BASE_URL}/friends/list/${userId}`, { headers });
// };

// export const unfriend = async (userId1, userId2) => {
//   return axios.post(`${BASE_URL}/friends/delete`, { userId1, userId2 }, { headers });
// };

// export const searchUsers = async (query) => {
//   return axios.get(`${BASE_URL}/friends/search?query=${query}`, { headers });
// };

// export default {
//   sendFriendRequest,
//   acceptFriendRequest,
//   rejectFriendRequest,
//   getFriendList,
//   unfriend,
//   searchUsers,
// };



import axios from "axios";
import { BASE_URL } from "./config";

const token = localStorage.getItem("token");

const config = {
  headers: {
    Authorization: `Bearer ${token}`,
  },
};

export const sendFriendRequest = async (senderId, receiverId) => {
  return axios.post(`${BASE_URL}/friends/send`, { senderId, receiverId }, config);
};

export const acceptFriendRequest = async (id) => {
  return axios.post(`${BASE_URL}/friends/accept/${id}`, {}, config);
};

export const rejectFriendRequest = async (id) => {
  return axios.post(`${BASE_URL}/friends/reject/${id}`, {}, config);
};

export const unfriend = async (userId1, userId2) => {
  return axios.post(`${BASE_URL}/friends/delete`, { userId1, userId2 }, config);
};

export const getFriendList = async (userId) => {
  return axios.get(`${BASE_URL}/friends/list/${userId}`, config);
};

export const searchFriends = async (query) => {
  const token = localStorage.getItem("token");
  return axios.get(`${BASE_URL}/friends/search?query=${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
