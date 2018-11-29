module.exports = function(RED) {
	
	var RingWrapper = require('./lib/ringdoorbell');
	
	
	function RingConfig(config) {
		RED.nodes.createNode(this, config);
		
		var globalContext = this.context().global;
		var node = this;
		node.modes = {test: config.testmode, debug: config.verbose}
		node.name = config.name
		
		
		var credentials = this.credentials
		if ((credentials) && (credentials.hasOwnProperty("email")) && (credentials.hasOwnProperty("password"))) {
			node.email = credentials.email
			node.password = credentials.password
		} else {
			node.error("No email or password set.")
		}
		
		node.log("Gathering Ring device info...")
		node.ring = new RingWrapper(this.email, this.password)
		
		node.ring.events.on("ready", async () => {
			let devices = await node.ring.getDevices();
			globalContext.set('ring-devices', devices);
			node.ringDevices = devices;
		})

		RED.httpAdmin.get("/ring-devices", (req,res) => {
            if(node.ringDevices) {
                res.send(node.ringDevices);
            } else if(node.ring) {
                node.ring.ringApi.devices().then(devices => {
                    res.send(devices);
                });
            } else {
                res.json([{name: "Error, please retry. Ring not connected."}]) 
            }
        });
		
		// Add any extra configuration to suncalc here
		node.ring.init()
		
	}
	
	// When an action occurs, can limit to specific device
	function RingActionNode(config) {
		
		// Create a RED node
		RED.nodes.createNode(this, config);
		var globalContext = this.context().global;
		var node = this;
		
		// Store local copies of the node configuration (as defined in the .html)
		node.modes = {test: config.testmode, debug: config.verbose}
		node.name = config.name
		node.topic = config.topic
		node.device = config.device
		node.ringConfig = RED.nodes.getNode(config.ring);

		node.ringConfig.ring.events.on("ringactivity", function(activity) {
			var msg = {}
			msg.topic = node.topic || node.name || 'ring event'
			msg.payload = activity
			
			node.log(`Injecting ring event. Device = ${node.device}`);
			// send out the message to the rest of the workspace.
			node.send(msg);
		});
		
		if (node.modes.debug) {
			node.ringConfig.ring.ringApi.events.on("debug", function(msg) {
				node.log(msg);
			});
		}
		
		node.on("close", function() {
			// Called when the node is shutdown - eg on redeploy.
			// Allows ports to be closed, connections dropped etc.
			// eg: this.client.disconnect();
		});
	}
	
	function DeviceFeedNode() {
		
	}
	
	// Register the node by name. This must be called before overriding any of the
	// Node functions.
	
	var credentials = {
		email: {type: "text"},
		password: {type: "password"}
	}
	
	RED.nodes.registerType("ring-config", RingConfig, {
		credentials: credentials
	});
	RED.nodes.registerType("ring-action", RingActionNode);
	RED.nodes.registerType("ring-feed", DeviceFeedNode);
}
