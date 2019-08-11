const investmentTrendComponent = {
    template: '#universitiesList',
    data: function () {
        return {
            searchTerm: "",
            universitiesList: [],
            filteredList: []
        }
    },
    created: function () {
        const that = this
        axios.get('/universities/list').then((res) => {
            if (res.data) {
                that.filteredList = that.universitiesList = res.data.sort((a, b) => a.rank - b.rank)
            }
        })
    },
    methods: {
        filter: function () {
            this.filteredList = this.universitiesList.filter(u => u.universityName.toLocaleLowerCase().indexOf(this.searchTerm) != -1)
        },
        openNotes: function (university) {
            this.$router.push({
                path: '/universityNotes', query: { uid: university.uid }
            })
        }
    },
    computed: {
    }
}

export default investmentTrendComponent