export default {
  data() {
    return {
      newComment: {
        title: '', 
        body: ''
      }
    };
  },
  methods: {
    create() {
      let comment = {person_id: this.currentPerson.id};
      
      for (let key in this.newComment) {
        comment[key] = this.newComment[key]; 
      }
      if (!comment.person_id) {
        throw new Error('comment has no person_id'); 
      } 
      this.$store.dispatch('comment/create', comment);
      for (let key in this.newComment) {
        this.newComment[key] = ''; 
      }
    },
    update(comment, ev) {
      const fields = {change_type: comment.change_type};
      fields[ev.target.name] = ev.target.value;
      this.$store.dispatch('comment/patch', {id: comment.id, fields});
    },
    remove(comment) {
      this.$store.dispatch('comment/delete', comment);
    }
  },
  computed: {
    currentComment() {
      return this.$store.getters['comment/current']; 
    },
    currentPerson() {
      return this.$store.getters['person/current']; 
    },
    comments() {
      return this.$store.getters['comment/undeleted']; 
    } 
  },
  mounted() {
    //this.$store.dispatch('comment/fetch');
  },
  watch: {
    currentPerson(person) {
      if (person) {
        this.$store.dispatch('comment/addOrder', {
          by: 'title', reverse: false});
        //this.$store.dispatch('comment/addOrder', {
        //  by: 'updated_at', reverse: true});
        this.$store.dispatch('comment/setScope', { person_id: person.id }); 
        this.$store.dispatch('comment/fetch').catch(err => console.error(err)); 
      }
    }
  }

};
