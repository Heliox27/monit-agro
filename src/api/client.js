import axios from "axios";

export const API_BASE_URL = "http://localhost:4000"; // tu json-server

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
});
