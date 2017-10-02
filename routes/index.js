'use strict';

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var Client = require('coinbase').Client;

  var client = new Client({
    'apiKey': process.env.cb_key,
    'apiSecret': process.env.cb_secret
  });

  client.getAccounts({}, function(err, accounts) {
    var infos = [];

    accounts.forEach((acct) => {
      var acct_info = {};
      acct_info.currency = acct.balance.currency;
      acct_info.exchange_rate = null;
      acct_info.listed_coin_count = acct.balance.amount;
      acct_info.usd_spent = 0.0;
      acct_info.coin_amount = 0.0;
      acct_info.transaction_count = 0;
      acct_info.usd_value = acct.native_balance.amount;

      client.getExchangeRates({'currency': acct_info.currency}, (err, rates) => {
        acct_info.exchange_rate = rates.data.rates.USD;
        
        acct.getTransactions(null, (err, txns) => {
          txns.forEach((txn) => {
            acct_info.transaction_count += 1;
            acct_info.coin_amount += parseFloat(txn.amount.amount);
            acct_info.usd_spent += parseFloat(txn.native_amount.amount);
            
            if (txns.length == acct_info.transaction_count) {
              infos.push(acct_info);
            }

            if (accounts.length == infos.length) { 
              res.render('index', { title: 'Coinworth', infos: infos }); 
            }
          });
        });
      });
    });
  });
});

module.exports = router;
