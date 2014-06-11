var path = require('path');
var commander = require('commander');
var sacloud = require('sacloud');

program = commander
  .version('0.0.1')
  .option('--list', 'List instances (default: True)')
  .option('--host <HOST>', 'Get all the variables about a specific instance', String)
  .parse(process.argv);

// initialize inventory
var inventory = { _meta: { hostvars: {} } };
var index = { };

var config = require(path.resolve(path.join(process.env['HOME'], '.sacloudcfg.json')));

var client = sacloud.createClient(config);
var c = sacloud.createCommander({ client: client });

var reqs = c.createRequests(['show', 'server']);
reqs.run(function _calback(err, result, requestedCount, totalCount) {
  if (err) { throw err }

  var servers = result.response.servers;

  servers.forEach(function (server) {
    var eth0 = server.interfaces[0];
    var dest = eth0.userIPAddress || eth0.ipAddress;

    index[dest] = host_info_from_server(server);

    inventory['sc'] = inventory['sc'] || [];
    inventory['sc'].push(dest);

    // // by id
    // inventory[server.id] = [dest];

    // // by zone.name
    // inventory[server.zone.name] = inventory[server.zone.name] || [];
    // inventory[server.zone.name].push(dest);

    // // by serviceClass
    // inventory[server.serviceClass] = inventory[server.serviceClass] || [];
    // inventory[server.serviceClass].push(dest);

    // // by tags
    // server.tags.forEach(function (tag) {
    //   var key = 'sc_tag_' + tag;
    //   inventory[key] = inventory[key] || [];
    //   inventory[key].push(dest);
    // });

    inventory['_meta']['hostvars'][dest] = host_info_from_server(server);
  });

  if (program.host) {
    return console.log(JSON.stringify(index[program.host], null, '  '));
  }

  console.log(JSON.stringify(inventory, null, '  '));
});

function host_info_from_server(server) {
  var instance_vars = {};

  instance_vars['sc_id'] = server.id;
  instance_vars['sc_name'] = server.name;
  instance_vars['sc_zone_name'] = server.zone.name;

  // ..

  return instance_vars;
}
