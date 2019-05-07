const path = require('path')

function callPythonProcessZerodhaTxFiles() {
  return new Promise((resolve, reject) => {
    const { spawn } = require('child_process');
    const pyprog = spawn('python', [path.join(__dirname, '../Zerodha/transaction_processing.py')]);

    let successData = ""
    pyprog.stdout.on('data', function (data) {
      // console.log(data.toString())
      successData += data.toString()
    });
    pyprog.stdout.on('end', function () {
      resolve(successData);
    });

    let errData = ""
    pyprog.stderr.on('data', (data) => {
      errData += data.toString()
    });
    pyprog.stderr.on('end', () => {
      reject(errData);
    });
  })
}

module.exports = callPythonProcessZerodhaTxFiles