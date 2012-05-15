#!/usr/bin/env node
var commander = require('commander');
var fs = require('fs');
var path = require('path');

commander
	.version('0.0.1')
	.option('-t, --tbd [t]', 'The time-to-breakdown under normal, constant-voltage-stress conditions', parseFloat)
	.option('-v, --vd [v]', 'The stress voltage applied to get the time-to-breakdown', parseFloat)
	.option('-n , --n [n]', 'The Power Law constant "n"', parseFloat)
	.option('-b, --beta [b]', 'The Weibull constant "beta"', parseFloat)
	.option('-i, --input [file]', 'The Comma-Separated-Values file containing the voltage distribution (x,V); assumes first x = 0')
	.parse(process.argv);

if(!commander.tbd || !commander.vd || !commander.n || !commander.beta || !commander.input) {
	console.warn("All options must be specified. See the --help for more information.");
	process.exit(-1);
} else if(!path.existsSync(commander.input)) {
	console.warn("The specified file does not exist.");
	process.exit(-2);
}

function splitTuple(line) {
	var tuple = line.split(',');
	if(tuple.length > 2 || isNaN(tuple[0]) || isNaN(tuple[1])) {
		return undefined;
	}
	return {
		l: parseFloat(tuple[0]),
		v: parseFloat(tuple[1])
	};
}

var nb1 = commander.n*commander.beta+1;
var file = fs.readFileSync(commander.input).toString().split('\n').reduce(function(reduction, line) {
	var tuple = splitTuple(line);
	if(tuple && tuple.v != reduction.v) {
		return {
			l: tuple.l,
    			v: tuple.v,
    			sum: reduction.sum + (
				(
					(tuple.l-reduction.l)*(Math.pow(tuple.v,nb1)-Math.pow(reduction.v,nb1))
				)/
				(
					nb1*(tuple.v-reduction.v)
				)
			)
		}
	} else if(tuple) {
		// Special case because solved integral above has a singularity for a constant voltage
		return {
			l: tuple.l,
    			v: tuple.v,
    			sum: reduction.sum + (tuple.v*(tuple.l-reduction.l))
		}
	} else {
		return reduction;
	}
}, {
	l: 0,
    	v: 0,
    	sum: 0
});

console.log(commander.tbd*Math.pow((Math.pow(commander.vd,commander.n*commander.beta)*file.l)/file.sum,1/commander.beta)+"");
