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
          data.push([valueObj._id, valueObj.value]);
        }

        let schema = [
          {
            name: "Date",
            type: "date",
            format: "%Y-%m-%d_%H-%M-%L", // https://www.fusioncharts.com/dev/fusiontime/fusiontime-attributes#date-time-format
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
            },
          ],
        };
        dataSource.data = dataStore.createDataTable(data, schema);

        new FusionCharts({
          type: "timeseries",
          renderAt: "batteryLogChart",
          width: "100%",
          height: "500",
          dataSource,
        }).render();
      })
      .catch(err => {
        console.log(err);
      });
  },
  methods: {},
  computed: {},
};

export default batteryLogChartComponent;
