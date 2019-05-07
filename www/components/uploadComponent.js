const investmentTrendComponent = {
  template: '#upload',
  data: function () {
    return {
      test: 'test'
    }
  },
  created: function () {

  },
  methods: {
    uploadFile: function () {
      let inputFile = this.$refs.fileInput
      if (inputFile.files.length > 0) {
        let formData = new FormData()
        let file = inputFile.files[0]
        formData.append(file.name, file)

        axios.post('/uploadFile', formData).then(resp => {
          console.log(resp)
        }).catch(err => {
          console.log(err)
        })
      }

    }
  },
  computed: {
  }
}

export default investmentTrendComponent