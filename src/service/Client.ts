import http from "../libs/Noga_Http";

const client = http;

const apiUrl = import.meta.env.VITE_API_URL;

if(!apiUrl){
    throw new Error("Variable VITE_API_URL is undefined.")
}

client.setBaseUrl(apiUrl.replace(/\/+$/,""));

export default client;