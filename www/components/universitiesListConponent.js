const investmentTrendComponent = {
    template: '#universitiesList',
    data: function () {
        return {
            searchTerm: "",
            universitiesList: [],
            filteredList: [],
            deadlines: {},
            sortOrder: 1
        }
    },
    created: function () {
        const that = this
        axios.get('/universities/list').then((res) => {
            if (res.data) {
                that.filteredList = that.universitiesList = res.data.sort((a, b) => a.rank - b.rank)
            }
        })

        axios.get('/universities/deadlines').then((res) => {
            // console.log(res.data)
            const data = res.data
            if (data && data.length) {
                data.forEach(deadline => {
                    // that.deadlines[deadline.uid] = deadline
                    Vue.set(that.deadlines, deadline.uid, deadline)
                })
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
        },
        sortByDeadline: function (prop) {
            // crude implementation, can be improvised
            this.sortOrder = this.sortOrder * -1
            this.universitiesList.sort((a, b) => {
                const aDeadline = this.deadlines[a.uid]
                const bDeadline = this.deadlines[b.uid]
                if (!aDeadline && !bDeadline) {
                    return 0
                } else if (aDeadline && !bDeadline) {
                    return this.sortOrder * 1
                } else if (!aDeadline && bDeadline) {
                    return this.sortOrder * -1
                } else {
                    return this.deadlines[a.uid][prop] > this.deadlines[b.uid][prop] ? this.sortOrder * 1 : this.sortOrder * -1
                }
            })
        },
        sort: function (prop) {
            this.sortOrder = this.sortOrder * -1
            this.universitiesList.sort((a, b) => {
                return a[prop] > b[prop] ? this.sortOrder * 1 : this.sortOrder * -1
            })
        }
    }
}

export default investmentTrendComponent