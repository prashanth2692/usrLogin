const optionStrategiesComponent = {
  template: '#optionStrategiesComponent',
  data: function () {
    return {
      strategyTrades: [],
      lotSize: 5700,
      strategies: [],
      strikeStepSize: 5,
      startStrike: 0,
      endStrike: 0
    }
  },
  created: function () { },
  mounted: function () {
    document.getElementById('contentFile').onchange = (evt) => {
      try {
        let files = evt.target.files;
        if (!files.length) {
          alert('No file selected!');
          return;
        }
        let file = files[0];
        let reader = new FileReader();
        reader.onload = (event) => {
          const { strategies, strategyTrades, lotSize, startStrike, endStrike, strikeStepSize } = JSON.parse(event.target.result)
          this.strategies = strategies
          this.strategyTrades = strategyTrades
          this.lotSize = lotSize
          this.startStrike = startStrike
          this.endStrike = endStrike
          this.strikeStepSize = strikeStepSize
          console.log('FILE CONTENT', event.target.result);
        };
        reader.readAsText(file);
      } catch (err) {
        console.error(err);
      }
    }
  },
  methods: {
    addTrade: function () {
      this.strategyTrades.push({ id: this.strategyTrades.length + 1, strikePrice: 0, price: 0, lots: 1, isLong: true, isCall: false })
    },
    setLotSize: function (value) {
      this.lotSize = value
    },
    addNewStrategy: function () {
      this.strategies.push({ value: "" })
    },
    analyzeStrategies: function () {
      let strategies = this.strategies.map(strategy => {
        const indexArray = strategy.value?.split(",")
        return indexArray.map(index => {
          const trade = this.strategyTrades[index]
          trade.quantity = trade.lots * this.lotSize
          trade.price = Number(trade.price)
          trade.strikePrice = Number(trade.strikePrice)
          return trade
        })
      })
      const result = this.executeBulk(strategies, Number(this.startStrike), Number(this.endStrike), Number(this.strikeStepSize))
      console.log(result)
      this.drawCharts(result)
    },
    downloadJSON: function () {
      const { strategies, strategyTrades, lotSize, startStrike, endStrike, strikeStepSize } = this

      const downloadObect = {
        strategies, strategyTrades, lotSize, startStrike, endStrike, strikeStepSize
      }
      var hiddenElement = document.createElement('a');
      hiddenElement.href = 'data:text/json;charset=utf-8,' + encodeURI(JSON.stringify(downloadObect));
      hiddenElement.target = '_blank';
      hiddenElement.download = 'strategies.json';
      hiddenElement.click();
    },
    drawCharts: function (results) {
      // https://www.fusioncharts.com/charts/line-area-charts/line-chart-with-multiple-series?framework=javascript
      // https://codepen.io/pen

      const categories = [{ category: results[0].map(s => ({ label: String(s.price) })) }]
      const dataset = results.map((result, i) => {
        return {
          seriesname: i,
          data: result.map(s => ({ value: s.payoff }))
        }
      })
      const dataSource = {
        chart: {
          caption: "Options strategy payoff",
          yaxisname: "Payoff",
          // subcaption: "2012-2016",
          showhovereffect: "1",
          // numbersuffix: "%",
          drawcrossline: "1",
          // plottooltext: "<b>$dataValue</b> of youth were on $seriesName",
          theme: "zune"
        },
        categories,
        // [
        //   {
        //     category: [
        //       {
        //         label: "2012"
        //       },
        //       {
        //         label: "2013"
        //       },
        //       {
        //         label: "2014"
        //       },
        //       {
        //         label: "2015"
        //       },
        //       {
        //         label: "2016"
        //       }
        //     ]
        //   }
        // ],
        dataset
      };

      FusionCharts.ready(function () {
        var myChart = new FusionCharts({
          type: "msline",
          renderAt: "option_strategy_analysis",
          width: "100%",
          height: "100%",
          dataFormat: "json",
          dataSource,
          "vdivlinecolor": "#dfdfdf",
          "vdivlinethickness": "2",
          "vdivlinealpha": "50",
          "vdivlinedashed": "1",
          "vdivlinedashgap": "3",
          theme: "Zune"
        }).render();
      });
    },
    removeStrategy: function (index) {
      this.strategies.splice(index, 1)
    },
    removeTrade: function (index) {
      // adjust indexes
      this.strategies = this.strategies.map(a => a.value).map(s => s.split(",").map(i => Number(i))
        .map(i => {
          return i == index ? "" : String(i < index ? i : i - 1)
        }).filter(s => s).join(",")).map(s => ({ value: s }))

      // remove empty strategies
      this.strategies = this.strategies.filter(s => s.value)

      //remove the trade
      this.strategyTrades.splice(index, 1)
    },

    /**
     * return the cost of executung the contract
     * returns negetive value when net money is received on executing the strategy (eg: shorting options)
     * @param {ContractInfo[]} contracts
     */
    getStrategyCost: function (contracts) {
      let cost = 0
      contracts.forEach(contract => {
        if (contract.isLong) {
          cost += contract.quantity * contract.price
        } else {
          cost -= contract.quantity * contract.price
        }
      })

      return cost
    },

    /**
    * 
    * @param {ContractInfo[]} contracts 
    * @param {number} stratPrice 
    * @param {number} endPrice 
    * @param {number} step 
    */
    getStrategyPayoff: function (contracts, stratPrice, endPrice, step) {
      let currPrice = stratPrice

      const payoffList = []
      while (currPrice <= endPrice) {
        const premiumsReceivedPerContract = contracts.map(contract => {
          let premium = (contract.isCall
            ? (currPrice > contract.strikePrice ? currPrice - contract.strikePrice : 0)
            : (currPrice < contract.strikePrice ? contract.strikePrice - currPrice : 0)) * contract.quantity

          premium = premium * (contract.isLong ? 1 : -1)

          return premium
        })

        const premiumReceived = premiumsReceivedPerContract.reduce((acc, current) => acc + current, 0)

        const payoff = premiumReceived - this.getStrategyCost(contracts)

        payoffList.push({ price: currPrice, payoff })

        currPrice += step
      }

      return payoffList
    },

    /**
    * @param {ContractInfo[]} contracts
    */
    execute: function (...args) {
      const result = this.getStrategyPayoff(...args)
      console.log(result)
      return result
    },

    /**
    * @param {ContractInfo[]} contracts
    */
    executeBulk: function (strategies, startPrice, endPrice, step) {
      const results = strategies.map((s) => this.execute(s, startPrice, endPrice, step))
      // console.log(getStrategyPayoff(...args))

      return results
    }
  },
  computed: {
  }
}

export default optionStrategiesComponent