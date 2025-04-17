import axios from "axios";

axios.get("/sanctum/csrf-cookie").then(() => {
  console.log("CSRF token initialized");
});