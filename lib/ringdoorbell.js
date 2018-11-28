var	util = require('util');
var	EventEmitter = require('events').EventEmitter;

var RingApi = require('ring-api');

function RingDoorbell(email, password) {
	
	this.email = email;
	this.password = password;
	
	this.debug = false;
	this.test = false;
	this.ringApi = null;
	
	this.job = null;
	this.timers = [];
	
	this.events = new EventEmitter();
	
	this.init = () => {
		this.ringApi = RingApi( {
			email: this.email,
			password: this.password,
			poll: true,
		});
		this.ringApi.then(function(r){
			self.events.emit("ready")
			const logActivity = activity => {
				self.events.emit("ringactivity", activity);
				self.events.emit(activity);
			}
			r.events.on('activity', logActivity);
		}).catch(function(err){
			console.log(err);
		})
	}
}

util.inherits(RingDoorbell, EventEmitter);
module.exports = RingDoorbell;
