var express = require('express');
var jsonWebToken = require('jsonwebtoken');
var router = express.Router();
var knex = require('../db/knex');
var bcrypt = require('bcrypt');

var http = require('http').Server(express);
var io = require('socket.io')(http);


var secret="CHANGETOENV";



function checkErr(res, err){
  var fail = false;
  if(err){
    fail = true;
    res.send(err);
  }
  return fail;
}


/* get all the fetches for current user*/
router.get('/', function(req, res, next){
  // console.log(req.user.id)
  // console.log(data)
  knex('fetches').select()
  .where({requestor_id: req.user.id})
  .then(function(data, err){
    if(!checkErr(res, err)){
      // console.log(data);
      res.json(data);
    }
  });
});

/*get all the fetches that are NOT from the current user */
router.get('/claimableFetches', function(req, res, next){
  knex('fetches').select()
  .whereNot({requestor_id: req.user.id})
  .then(function(data, err){
    if(!checkErr(res, err)){
      res.json(data);
    }
  });
});


/* add a new fetch */
router.post('/', function(req, res, next){
  var newFetch = req.body;
  var date = new Date();
  console.log(req.user);
  knex('fetches').insert({
    item: newFetch.item,
    paymentAmount: newFetch.paymentAmount,
    paymentType: "cash",
    // paymentType: newFetch.paymentType,
    lat: newFetch.lat,
    lng: newFetch.lng,
    dateRequested: date,
    requestor_id: req.user.id,
    address: newFetch.address
  })
  .then(function(data, err){
    if(!checkErr(res, err)){
      globalObject.socketServer.emit('update', {
        item: newFetch.item,
        paymentAmount: newFetch.paymentAmount,
        paymentType: "cash",
        // paymentType: newFetch.paymentType,
        lat: newFetch.lat,
        lng: newFetch.lng,
        dateRequested: date,
        requestor_id: req.user.id,
        address: newFetch.address
      });
      res.send('success');
    }
  });
});

router.get('/userHistory', function(req, res, next){
  knex('fetches').select()
  .where({claimor_id: req.user.id})
  // .join('users', users.id, fetches.requestor_id)
  // .select(users.id, users.email, users.firstName);
  // .select(fetches.*, users.id, users.email, "users"."firstName", "users"."lastName", "users"."phoneNumber")
.then(function(data, err){
  if(!checkErr(res, err)){
    res.json(data);
  }
  });
});


router.put('/update', function(req, res, next){
  knex('fetches').where({id: req.body.id})
  .update({
    item: req.body.item,
    paymentAmount: req.body.paymentAmount,
    address: req.body.address
  })
  .then(function(data, err){
    if(!checkErr(res, err))
    {
      res.send('success');
    }
  });
});


router.put('/claim', function(req, res, next) {
  var date = new Date();
  // console.log(req.user);
  knex('fetches').where({id: req.body.id})
  .update({
      item: req.body.item,
      paymentAmount: req.body.paymentAmount,
      paymentType: req.body.paymentType,
      dateClaimed: date,
      claimor_id: req.user.id
    })
  .then(function(data, err) {
    if(!checkErr(res, err))
    {
      globalObject.socketServer.emit('claimOrClose', {
        item: req.body.item,
        paymentAmount: req.body.paymentAmount,
        paymentType: req.body.paymentType,
        dateClaimed: date,
        claimor_id: req.user.id
      });
      res.send('success');
    }
  });
});

router.put('/close', function(req, res, next) {
  var date = new Date();
  knex('fetches').where({id: req.body.id})
  .update({
    dateClosed: date
  })
  .then(function(data, err) {
    if(!checkErr(res, err))
    {
      globalObject.socketServer.emit('claimOrClose', {
        dateClosed: date
      });
      res.send('success');
    }
  });
});

router.post('/delete', function(req, res, next){
  // console.log(req.body);
  knex('fetches').where({id: req.body.id}).del()
  .then(function(data, err){
    if(!checkErr(res, err))
    {
        globalObject.socketServer.emit('claimOrClose', {

        });
      res.send('success');
    }
  });
});


router.get('/userInformation', function(req, res, next){
  console.log(req.user);
  knex('users').select('id', 'email', 'firstName', 'lastName', 'phoneNumber').where({id: req.user.id})
  .then(function(data, err){
    if(!checkErr(res, err)){
      res.json(data);
    }
  });
});
// knex.select('*').from('users').leftOuterJoin('accounts', function() {
//   this.on('accounts.id', '=', 'users.account_id').orOn('accounts.owner_id', '=', 'users.id')
// })

// SELECT * FROM fetches LEFT OUTER JOIN users ON fetches.requestor_id = users.id WHERE claimor_id = '3';
// route that connects the current req.user id with the claimor_id. Then join that fetch's id requestor_id to the their ID on the users table.
 router.get('/retrievingFetchContactInfo', function(req, res, next){
   console.log(req.user);
   knex('fetches').select().
   leftOuterJoin('users', 'fetches.requestor_id', 'users.id')
   .where('fetches.claimor_id', req.user.id)

  //  .on('fetches.requestor_id', '=', 'users.id').where('fetches.claimor_id', '=', 'req.user.id')
   .then(function(data, err){
     console.log(data);
   res.json(data);
 });
});



module.exports = router;
