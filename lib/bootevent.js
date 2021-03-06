'use strict';

var bootevent = require('bootevent');

function boot (env) {

  function setupMongo (ctx, next) {
    var store = require('./storage')(env);
    // initialize db connections
    store( function ready ( ) {
      console.log('storage system ready');
      ctx.store = store;

      next( );
    });
  }

  function setupInternals (ctx, next) {
    ///////////////////////////////////////////////////
    // api and json object variables
    ///////////////////////////////////////////////////
    ctx.plugins = require('./plugins')().registerServerDefaults().init(env);
    ctx.pushnotify = require('./pushnotify')(env, ctx);
    ctx.entries = require('./entries')(env, ctx);
    ctx.treatments = require('./treatments')(env, ctx);
    ctx.devicestatus = require('./devicestatus')(env.devicestatus_collection, ctx);
    ctx.profile = require('./profile')(env.profile_collection, ctx);
    ctx.pebble = require('./pebble')(env, ctx);
    ctx.bus = require('./bus')(env, ctx);
    ctx.data = require('./data')(env, ctx);
    ctx.notifications = require('./notifications')(env, ctx);

    next( );
  }

  function ensureIndexes (ctx, next) {
    console.info("Ensuring indexes");
    ctx.store.ensureIndexes(ctx.entries( ), ctx.entries.indexedFields);
    ctx.store.ensureIndexes(ctx.treatments( ), ctx.treatments.indexedFields);
    ctx.store.ensureIndexes(ctx.devicestatus( ), ctx.devicestatus.indexedFields);
    ctx.store.ensureIndexes(ctx.profile( ), ctx.profile.indexedFields);

    next( );
  }

  function setupListeners (ctx, next) {
    function updateData ( ) {
      ctx.data.update(function dataUpdated () {
        ctx.bus.emit('data-loaded');
      });
    }

    ctx.bus.on('tick', function timedReloadData (tick) {
      console.info('tick', tick.now);
      updateData();
    });

    ctx.bus.on('data-received', function forceReloadData ( ) {
      console.info('got data-received event, reloading now');
      updateData();
    });

    ctx.bus.on('data-loaded', function updatePlugins ( ) {
      var sbx = require('./sandbox')().serverInit(env, ctx);
      ctx.plugins.setProperties(sbx);
      ctx.notifications.initRequests();
      ctx.plugins.checkNotifications(sbx);
      ctx.notifications.process(sbx);
      ctx.bus.emit('data-processed');
    });

    ctx.bus.on('notification', ctx.pushnotify.emitNotification);

    next( );
  }

  function finishBoot (ctx, next) {
    ctx.bus.uptime( );

    next( );
  }

  var proc = bootevent( )
    .acquire(setupMongo)
    .acquire(setupInternals)
    .acquire(ensureIndexes)
    .acquire(setupListeners)
    .acquire(finishBoot)
    ;

  return proc;

}

module.exports = boot;
