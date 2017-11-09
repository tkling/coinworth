'use strict';

var datetime = require('node-datetime');
var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  var Client = require('coinbase').Client;
  var titleString = '';

  var client = new Client({
    'apiKey': process.env.cb_key,
    'apiSecret': process.env.cb_secret
  });

  client.getAccounts({}, function(err, accounts) {
    var infos = [];

    var nonUSDAccounts = (accounts || []).filter((acct) => { return acct.balance.currency !== 'USD'; });
    nonUSDAccounts.forEach((acct) => {
      var acct_info = initAccountViewObject(acct);

      client.getExchangeRates({'currency': acct_info.currency}, (err, rates) => {
        acct.getTransactions(null, (err, txns) => {
          acct_info.exchange_rate = rates === null ? 0 : rates.data.rates.USD;

          if (txns === null) txns = [];

          txns.forEach((txn) => {
            acct_info.transaction_count += 1;
            acct_info.coin_amount += parseFloat(txn.amount.amount);
            acct_info.usd_spent += parseFloat(txn.native_amount.amount);

            if (txns.length == acct_info.transaction_count) {
              acct_info.percentage = (acct_info.usd_value / acct_info.usd_spent * 100 - 100).toFixed(2);
              acct_info.usd_spent = acct_info.usd_spent.toFixed(2);
              acct_info.usd_value = parseFloat(acct_info.usd_value).toFixed(2);
              infos.push(acct_info);

              if (acct_info.currency === 'BTC') {
                titleString = '$' + parseFloat(acct_info.usd_value).toFixed(0).toString()
                  + '@$' + parseFloat(acct_info.exchange_rate).toFixed(0).toString();
              }
            }

            if (nonUSDAccounts.length == infos.length) {
              res.render('index', {
                title: titleString,
                time: datetime.create(Date.now()).format('m/d/y I:M p'),
                infos: sortAccounts(infos)
              });
            }
          });
        });
      });
    });
  });
});

function initAccountViewObject(coinbaseAcct) {
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
