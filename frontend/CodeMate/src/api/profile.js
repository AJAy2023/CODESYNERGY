import axios from "axios";
import { BASE_URL } from "./config";

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getProfile = (id) =>
  axios.get(`${BASE_URL}/profile/${id}`, { headers: authHeader() });

export const updateProfile = (payload) =>
  axios.put(`${BASE_URL}/profile/update`, payload, { headers: authHeader() });

export const deleteAccount = () =>
  axios.delete(`${BASE_URL}/profile/delete`, { headers: authHeader() });
