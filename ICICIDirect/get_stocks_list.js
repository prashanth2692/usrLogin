// const { URL, URLSearchParams } = require('url');
// const https = require('https');
const axios = require('axios');
const fs = require('fs');
const alphabet = require('alphabet');

var headers = {
  Host: 'secure.icicidirect.com',
  Connection: 'keep-alive',
  'Content-Length': '160',
  Pragma: 'no-cache',
  'Cache-Control': 'no-cache',
  Accept: '*/*',
  Origin: 'https://secure.icicidirect.com',
  'X-Requested-With': 'XMLHttpRequest',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
  'Content-Type': 'application/x-www-form-urlencoded',
  Referer: 'https://secure.icicidirect.com/IDirectTrading/Trading/Trade.aspx',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept-Language': 'en-US,en;q=0.9',
  Cookie: '_ga=GA1.2.452591986.1506005270; _gid=GA1.2.1224897706.1546683814; InterSecure=AJBmR55AEKz3LYxb65pJWw$$; ASP.NET_SessionId=z14r022wao33beodrax2r4yy'
}


// alphabet.upper.forEach(element => {
//   let ele = element
//   axios.post('https://secure.icicidirect.com/IDirectTrading/Trading/Equity/EquityHandler.ashx', 'txtSymbol=&drpProduct=A&drpExcnge=NSE&lnkRefresh=View&FML_STCK_CD_CHR=' + ele + '&__VIEWSTATEGENERATOR=C21772F6&pgname=StockList&ismethodcall=1&mthname=GetStockListResult', {
//     headers: headers
//   }).then((result) => {
//     // console.log(result.data)
//     let writeStream = fs.createWriteStream("./output/"+ ele + ".html")
//     writeStream.write(result.data, function (err) {
//       if (err) {
//         return console.log(err);
//       }

//       console.log("The file was saved!");
//     });
//     writeStream.end()
//   }).catch((err) => {
//     console.log(err)
//   });
// });


let ele = 1
  axios.post('https://secure.icicidirect.com/IDirectTrading/Trading/Equity/EquityHandler.ashx', 'txtSymbol=&drpProduct=A&drpExcnge=NSE&lnkRefresh=View&FML_STCK_CD_CHR=' + ele + '&__VIEWSTATEGENERATOR=C21772F6&pgname=StockList&ismethodcall=1&mthname=GetStockListResult', {
    headers: headers
  }).then((result) => {
    // console.log(result.data)
    let writeStream = fs.createWriteStream("./output/"+ ele + ".html")
    writeStream.write(result.data, function (err) {
      if (err) {
        return console.log(err);
      }

      console.log("The file was saved!");
    });
    writeStream.end()
  }).catch((err) => {
    console.log(err)
  });