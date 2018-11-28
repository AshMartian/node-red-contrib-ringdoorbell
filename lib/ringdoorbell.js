var	util = require('util');
var	EventEmitter = require('events').EventEmitter;

var RingApi = require('ring-api');

function RingDoorbell(email, password) {
	
	var this.events = this;
	
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
			this.events.emit("ready")
			const logActivity = activity => {
				this.events.emit("ringactivity", activity);
				this.events.emit(activity);
			}
			r.events.on('activity', logActivity);
		}).catch(function(err){
			console.log(err);
		})
	}
}

util.inherits(RingDoorbell, EventEmitter);
module.exports = RingDoorbell;
