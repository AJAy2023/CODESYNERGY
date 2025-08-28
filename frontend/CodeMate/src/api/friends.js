// src/api/friends.js
import axios from "axios";
import { BASE_URL } from "./config";
import { getToken } from "../utils/auth";

function authHeaders() {
  const t = getToken() || localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export const searchUsers = (query) => {
  return axios.get(`${BASE_URL}/friends/search`, {
    params: { query },
    headers: authHeaders(),
  });
};

export const getIncomingRequests = (userId) => {
  return axios.get(`${BASE_URL}/friends/incoming/${userId}`, {
    headers: authHeaders(),
  });
};

export const getOutgoingRequests = (userId) => {
  return axios.get(`${BASE_URL}/friends/outgoing/${userId}`, {
    headers: authHeaders(),
  });
};

export const acceptFriendRequest = (requestId) => {
  return axios.post(`${BASE_URL}/friends/accept/${requestId}`, {}, { headers: authHeaders() });
};

export const rejectFriendRequest = (requestId) => {
  return axios.post(`${BASE_URL}/friends/reject/${requestId}`, {}, { headers: authHeaders() });
};

export const cancelOutgoingRequest = (requestId) => {
  return axios.delete(`${BASE_URL}/friends/cancel/${requestId}`, { headers: authHeaders() });
};

export const sendFriendRequest = (senderId, receiverId) => {
  return axios.post(`${BASE_URL}/friends/send`, { senderId, receiverId }, { headers: authHeaders() });
};

export const getFriendStatus = (userId) => {
  return axios.get(`${BASE_URL}/friends/status/${userId}`, { headers: authHeaders() });
};

export const unfriend = (userId1, userId2) => {
  return axios.post(`${BASE_URL}/friends/delete`, { userId1, userId2 }, { headers: authHeaders() });
};
