import axios from "axios";

const LOCAL_END_POINT = "http://localhost:5000/api/";
const PROD_END_POINT = "/api/";

const END_POINT =
  process.env.NODE_ENV === "development" ? LOCAL_END_POINT : PROD_END_POINT;

export default axios.create({
  baseURL: END_POINT,
});

export { END_POINT };
