const http = require("http");
const url = require("url");
var axios = require("axios");
var StringDecoder = require("string_decoder").StringDecoder;
let score = 0;
let times = 0;

const tokens = [];

http
  .createServer(function(req, res) {
    const parsedUrl = url.parse(req.url, true);
    console.log(req.socket.remoteAddress);
    switch (parsedUrl.pathname) {
      case "/":
        sendFile(__dirname + "/index.html", res);
        break;
      case "/favicon.ico":
        sendFile(__dirname + "/favicon.ico", res);
        break;
      case "/particles.json":
        sendFile(__dirname + "/particles.json", res);
        break;
      case "/registration":
        registrationHandler(req, res);
        break;
      default:
        sendResponse(res, 404, {});
    }
  })
  .listen(8080);

const sendResponse = (response, statusCode, responseObject) => {
  response.setHeader("Content-Type", "Application/json");
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.writeHead(statusCode);
  response.end(JSON.stringify(responseObject)); //e
};

const readPostData = req => {
  return new Promise(function(resolve, reject) {
    var decoder = new StringDecoder("utf-8");
    var buffer = "";
    req.on("data", function(data) {
      buffer += decoder.write(data);
    });

    req.on("end", function() {
      buffer += decoder.end();
      resolve(JSON.parse(buffer));
    });
  });
};

const verifyUser = (sitekey, token) => {
  return axios
    .post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${sitekey}&response=${token}`,
      {},
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
        }
      }
    )
    .then(function(response) {
      score += response.data.score;
      times++;
      console.log(
        "TIME : " +
          Date.now() +
          " SCORE : " +
          response.data.score +
          " challenge_ts: " +
          response.data.challenge_ts +
          " sa " +
          score / times
      );
      return response.data;
    })
    .catch(function(error) {
      return error;
    });
};

const registrationHandler = async (req, res) => {
  const payload = await readPostData(req);
  tokens.includes(payload.token)
    ? console.log("TOKEN REPLICATE ")
    : tokens.push(payload.token);
  sendResponse(
    res,
    200,
    await verifyUser("6Lfx9JoUAAAAAELHGYVF_x248TDg37hCxjDS7OBi", payload.token)
  );
};

const sendFile = (filename, res) => {
  const fs = require("fs");
  fs.readFile(filename, function(err, data) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.write(data);
    res.end();
  });
};
