const investmentTrendComponent = {
  template: "#devicesList",
  data: function() {
    return {
      devices: false,
    };
  },
  created: function() {
    this.getDevices();
  },
  methods: {
    getDevices: function() {
      axios
        .get("/battery/devices")
        .then(resp => {
          this.devices = resp.data;
        })
        .catch(err => {
          console.log(err);
        });
    },
    openBatteryLogChart: function(deviceId) {
      if (!deviceId) return;
      this.$router.push({
        path: "/batteryLogChart",
        query: { deviceId },
      });
    },
  },
  computed: {},
};

export default investmentTrendComponent;
