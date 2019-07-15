

const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

var onvif = null;
try {
	onvif = require('./lib/nodejs-onvif');
} catch(e) {
	onvif = require('node-onvif');
}

// our default username
const onvif_user = process.env.DEFAULT_ONVIF_USER || "onvif";
// our default password
const onvif_pwd = process.env.DEFAULT_ONVIF_PWD || "123456a@";

var devices = {};
var devices_sumary = {};
function startDiscovery() {
	devices = {};
	let names = {};
	onvif.startProbe().then((device_list) => {
		device_list.forEach((device) => {
			let odevice = new onvif.OnvifDevice({
				xaddr: device.xaddrs[0]
			});
			let addr = odevice.address;
			devices[addr] = odevice;
			names[addr] = device.name;
			//try to connect with default user/pass
			odevice.setAuth(onvif_user, onvif_pwd);
			let connect_status =false;
			odevice.init((error, result) => {
				var res = {'id': 'connect'};
				if(error) {
					res['error'] = error.toString();
				} else {
					res['result'] = result;
					connect_status = true;
				}
			});
			devices_sumary[addr] = {
				name: names[addr],
				address: addr,
				user: onvif_user,
				password: onvif_pwd,
				connected: connect_status
			}
        console.log("found: " + JSON.stringify(devices));		
	}).catch((error) => {
		console.log('connect error:'+ error.message);		
	});
}


// our localhost port
const port = process.env.PORT || 3001;

const app = express();

// our server instance
const server = http.createServer(app);

// This creates our socket using the instance of the server
const io = socketIO(server);

io.on("connection", socket => {
  console.log("New client connected" + socket.id);
  //console.log(socket);

  // Returning the initial data of cameras from Camera collection
  socket.on("initial_data", () => {
      io.sockets.emit("get_data", devices_sumary);
  });

  // Request connect, gets called from /Camera.js of Frontend
  socket.on("connect", devs => {
    var device = devices[devs.address];
	if(!device) {
		var res = {'id': 'connect', 'error': 'The specified device is not found: ' + devs.address};
		io.sockets.emit("error", JSON.stringify(res));
		return;
	}
	if(devs.user) {
		device.setAuth(params.user, params.pass);
	}
	device.init((error, result) => {
		var res = {'id': 'connect'};
		if(error) {
			res['error'] = error.toString();
		} else {
			res['result'] = result;
		}
		io.sockets.emit("connected", JSON.stringify(res));
	});    
  });
  // disconnect is fired when a client leaves the server
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

app.use(express.static("build"));
app.use("/camera", express.static("build"));
app.use("/updatecamera", express.static("build"));

server.listen(port, () => {
    startDiscovery();
    console.log(`Listening on port ${port}`);
});