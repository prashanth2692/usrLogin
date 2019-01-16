const nseArrayJson = require('../ICICIDirect/output/NSE_EQUITY_L_ARRAY.json')
const nseDictISIN = require('../ICICIDirect/output/NSE_EQUITY_L_DICT_ISIN.json')
const nseISINSymbol = require('../ICICIDirect/output/NSE_EQUITY_L_DICT_SYMBOL.json')


module.exports = {
  array: nseArrayJson,
  dictISIN: nseDictISIN,
  dictSymbol: nseISINSymbol
}