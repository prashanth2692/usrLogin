// This script is to consolidate symbol data from icici and nse.
// ICICI Direct has its own symbol naming convention
// Compnay name is tried to match between nse list and icici list

const _ = require('underscore')

const iciciScripList = require('./output/completeDate.json')
const nseList = require('./output/NSE_EQUITY_L_ARRAY.json')
// const intradayTeam = require('./intradayteam.json')

const consolidateHoldings = require('./output/consolidatedHoldings_obj.json')


let total = 0
let totalMatched = 0
let consolidatedScripData = []
for (let iScrip in iciciScripList) {
  total++
  let searchResult = _.find(nseList, (item) => {
    return item.name_of_company.toUpperCase().indexOf(iciciScripList[iScrip]) > -1
  })

  if (searchResult) {
    totalMatched++
    consolidatedScripData.push({ nse: searchResult.symbol, icici: iScrip })
    // console.log(iScrip, searchResult.symbol, searchResult.name_of_company)
  } else {
    // console.error('ERROR - ', iScrip, iciciScripList[iScrip])
  }
}

console.log('nse list count: ', nseList.length)
console.log('icici total: ', total, ' totalMatche: ', totalMatched)


let totalHoldings = 0
let holdingsMatch = 0
for (let holding in consolidateHoldings) {
  totalHoldings++
  let result = _.findWhere(consolidatedScripData, { nse: consolidateHoldings[holding].symbol })


  if (result) {
    holdingsMatch++
  } else {
    console.log(consolidateHoldings[holding])
  }
}

console.log(totalHoldings, holdingsMatch)



// http://www.intradayteam.com/2008/09/list-of-nse-scrip-codes-to-icici-direct.html
// let x = $('tbody')
// let finalList = []
// x.each(x1 => {
//   let tds = x[x1].children
// //console.log(tds)
// if(tds[0] && tds[1] && tds[2]){  
// let temp = {
//     nse_code: tds[0].innerHTML,
//     icici_code: tds[1].innerHTML,
//     company_name: tds[2].innerHTML
//   }
// finalList.push(temp)
//   //console.log(temp)
// }
// })


// let x = 0
// let y = 0
// for (let iScrip in iciciScripList) {
//   x++
//   let searchResult = _.find(intradayTeam, (item) => {
//     return item.company_name.toUpperCase().indexOf(iciciScripList[iScrip]) > -1 || item.icici_code == iScrip
//   })

//   if (searchResult) {
//     y++
//     console.log(iScrip, searchResult.nse_code, searchResult.company_name)
//   } else {
//     console.error('ERROR - ', iScrip, iciciScripList[iScrip])
//   }
// }

// console.log(x, y)