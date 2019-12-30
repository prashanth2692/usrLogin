const batteryLogChartComponent = {
  template: "#batteryLogChart",
  data: function() {
    return {
      logs: [],
    };
  },
  created: function() {
    const query = this.$route.query;
    const deviceId = query.deviceId;
    axios
      .get("/battery/logs?deviceId=" + deviceId)
      .then(resp => {
        this.logs = resp.data;
        const data = [];

        for (const valueObj of this.logs) {
          if (valueObj._id.indexOf("-") === -1) {
            // if condition is hack to filter out bad data(date not in required format)
            data.push([valueObj._id, Number(valueObj.value) || 0]);
          }
        }

        let schema = [
          {
            name: "Date",
            type: "date",
            format: "%Y%m%d_%H%M%L", // https://www.fusioncharts.com/dev/fusiontime/fusiontime-attributes#date-time-format
          },
          {
            name: "value",
            type: "number",
          },
        ];

        const dataStore = new FusionCharts.DataStore();
        const dataSource = {
          chart: {},
          caption: {
            text: "Battery chart",
          },
          series: "type",
          yaxis: [
            {
              plot: {
                value: "value",
                type: "line",
                connectnulldata: true,
              },
              title: "Battery Level",
              round: false,
            },
          ],
        };
        dataSource.data = dataStore.createDataTable(data, schema);

        new FusionCharts({
          type: "timeseries",
          renderAt: "batteryLogChartHolder",
          width: "100%",
          height: "500",
          dataSource,
        }).render();

        this.calculateRateOfChange(resp.data);
      })
      .catch(err => {
        console.log(err);
      });
  },
  methods: {
    calculateRateOfChange(logs) {
      const rateOfChange = logs.map((log, i) => {
        if (i === 0) {
          return {
            dateTime: log._id,
            value: 0,
          };
        } else {
          const fromDate = moment(logs[i - 1]._id, "YYYYMMDD_HHmmss");
          const value1 = Number(logs[i - 1].value);
          const toDate = moment(logs[i]._id, "YYYYMMDD_HHmmss");
          const value2 = Number(logs[i].value);
          const valueDiff = value2 - value1;
          // calculate diff only if absolute value of diff is 1
          //   const diffDurationAsMinutes =
          //     Math.abs(valueDiff) === 1 ? moment.duration(toDate.diff(fromDate)).asMinutes() : 0;

          const diffDurationAsMinutes =
            Math.abs(valueDiff) === 1 ? valueDiff / moment.duration(toDate.diff(fromDate)).asMinutes() : 0;

          return {
            dateTime: log._id,
            value: diffDurationAsMinutes,
          };
        }
      });

      console.log("rate of change of battery:", rateOfChange);
      return rateOfChange;
    },
  },
  computed: {},
};

export default batteryLogChartComponent;
