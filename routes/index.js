'use strict';

var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  var Client = require('coinbase').Client;

  var client = new Client({
    'apiKey': process.env.cb_key,
    'apiSecret': process.env.cb_secret
  });

  client.getAccounts({}, function(err, accounts) {
    var infos = [];

    accounts.forEach((acct) => {
      var acct_info = initializedAccountViewObj(acct);

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
              res.render('index', { title: 'Coinworth', infos: sortAccounts(infos) });
            }
          });
        });
      });
    });
  });
});

function initializedAccountViewObj(coinbaseAcct) {
  return {
    'currency': coinbaseAcct.balance.currency,
    'listed_coin_count': coinbaseAcct.balance.amount,
    'usd_value': coinbaseAcct.native_balance.amount,
    'exchange_rate': null,
    'usd_spent': 0.0,
    'coin_amount': 0.0,
    'transaction_count': 0
  };
}

function sortAccounts(accounts) {
  return accounts.sort((a, b) => {
    if (a.currency > b.currency) { return 1; }
    if (a.currency < b.currency) { return -1; }
    return 0;
  });
}

module.exports = router;
