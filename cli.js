#!/usr/bin/env node
'use strict';
var path = require('path');
var commander = require('commander');
var sacloud = require('sacloud');

var program = commander
  .version('0.0.1')
  .option('--list', 'List instances (default: True)')
  .option('--host <HOST>', 'Get all the variables about a specific instance', String)
  .parse(process.argv);

// initialize inventory
var inventory = { _meta: { hostvars: {} } }

var config = require(path.resolve(path.join(process.env['HOME'], '.sacloudcfg.json')));

var client = sacloud.createClient(config);

client.createRequest({
  method: 'GET',
  path: 'server'
}).send(function(err, result) {
  if (err) throw new Error(err);

  var servers = result.response.servers;
  servers.forEach(function (server) {
    if (server.instance.status !== 'up') {
      return;
    }

    var dest;
    for (var i = 0; i < server.interfaces.length; i++) {
      dest = server.interfaces[i].ipAddress || server.interfaces[i].userIPAddress;
      if (dest) {
        break;
      }
    }

    // have no address
    if (!dest) {
      return;
    }

    // by id
    inventory[server.id] = [dest];

    // by zone.name
    inventory[server.zone.name] = inventory[server.zone.name] || [];
    inventory[server.zone.name].push(dest);

    // by serviceClass
    inventory[server.serviceClass] = inventory[server.serviceClass] || [];
    inventory[server.serviceClass].push(dest);

    // by tags
    server.tags.forEach(function (tag) {
      var key = 'sc_tag_' + tag;
      inventory[key] = inventory[key] || [];
      inventory[key].push(dest);
    });

    inventory._meta.hostvars[dest] = host_info_from_server(server);
  });

  if (program.host) {
    console.log(JSON.stringify(inventory._meta.hostvars[program.host], null, '  '));
    return;
  }

  console.log(JSON.stringify(inventory, null, '  '));
});

function host_info_from_server(server) {
  var instance_vars = {
    sc_id: server.id,
    sc_name: server.name,
    sc_hostname: server.hostName,
    sc_zone_name: server.zone.name
  };

  return instance_vars;
}
