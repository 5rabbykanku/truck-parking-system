import axios from 'axios'

export const API_URL = 'https://upload-sprout-tribune.ngrok-free.dev'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
})