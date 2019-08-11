const investmentTrendComponent = {
    template: '#universityNotes',
    data: function () {
        return {
            university: null,
            notes: {},
            newNote: {
                key: '',
                value: ''
            },
            error: false,
            readOnlyKeys: ['_id', 'uid', 'universityName', 'location', 'rank', 'program', 'rankingSite']
        }
    },
    created: function () {
        const promiesArray = []
        const that = this

        // hopefully query has universityName rank and location
        const query = this.$route.query
        const uid = query.uid
        // console.log(query)
        if (query && query.uid) {
            const that = this
            let promise = axios.get('/universities/getById?uid=' + uid).then((res) => {
                let data = null
                if (res.data) {
                    data = res.data
                }
                else {
                    // if notes doesn't exist, populate initial data
                    data = query
                }
                that.university = data

            })

            promiesArray.push(promise)

            promise = axios.get(`/universities/notes?uid=${uid}`).then((res) => {
                if (res.data) {
                    that.notes = res.data
                }
            })
            promiesArray.push(promise)
            Promise.all(promiesArray).then((responses) => {
                if (!that.notes.uid) {
                    Vue.set(that.notes, 'uid', that.university.uid)
                    // that.notes.uid = that.university.uid
                }
            })
        }
    },
    methods: {
        saveNotes: function () {
            axios.post('/universities/notes', this.notes).then(res => {
                console.log(res)
            }).catch(err => {
                console.log(err)
            })
        },
        addNote: function () {
            this.error = false
            this.notes[this.newNote.key] = this.newNote.value

            // clear new Note values
            this.newNote.key = ''
            this.newNote.value = ''
        },
        deleteNote: function (key) {
            // TODO: This action isn't supported completely yet in coontroller
            // delete this.notes[key] // This doesn trigger UI change, use Vue.delete
            Vue.delete(this.notes, key)
        },
        editNote: function (key) {
            this.newNote.key = key
            this.newNote.value = this.notes[key]
            this.$refs.newNoteValue.focus()
        }
    },
}

export default investmentTrendComponent