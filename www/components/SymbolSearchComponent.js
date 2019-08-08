//@ts-check
const holdingsComponent = {
    template: '#symbolSearch',
    data: function () {
        return {
            searchTerm: "",
            symbols: [],
            loading: false
        }
    },
    created: function () {
        // let query = this.$route.query
        // if (query && query.past) {
        //     this.showPastHoldings = true
        // }
    },
    methods: {
        getSymbols: function () {
            let that = this
            if (!this.searchTerm) {
                return
            }
            this.symbols = []
            this.loading = true
            axios.get('/symbol/search?partialName=' + that.searchTerm).then((response) => {
                if (response.data) {
                    that.symbols = response.data
                }
                that.loading = false
            }).catch(() => {
                that.loading = false
                that.symbols = []
            })
        },
        navigateToMsgBoard: function (symbol) {
            this.$router.push({
                path: '/messages', query: {
                    topicid: symbol.moneycontrol_messageboard_topicid,
                    compid: symbol.compid_imp,
                    symbol: symbol.symbol
                }
            })
        }
    }
}

export default holdingsComponent