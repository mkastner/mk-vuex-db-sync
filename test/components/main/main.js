import ChangeTypeConstants from '../../../src/change-type-constants';

export default {
  data() {
    return {
      newName: ''
    };
  },
  mounted() {
    console.log('^^^^^^^^^^^^^^ mounted fetching ^^^^^^^^^^^^^^^^');
    this.$store.dispatch('person/fetch');
  },
  methods: {
    update(person, ev) {
      const fields = {change_type: person.change_type};
      fields[ev.target.name] = ev.target.value;
      this.$store.dispatch('person/patch', {id: person.id, fields});
    }, 
    remove(person) {
      this.$store.dispatch('person/delete', person);
    },
    create() {
      this.$store.dispatch('person/create', {name: this.newName});
    },
    changeType(person) {
      let s = '';
      switch (person.change_type) {
      case ChangeTypeConstants.ChangeTypeDeleted:
        s = 'deleted';
        break;
      case ChangeTypeConstants.ChangeTypeCreated:
        s = 'created';
        break;
      case ChangeTypeConstants.ChangeTypeUpdated:
        s = 'updated';
        break;
      default:
        s = 'unchanged';
        break;
      }
      return s;
    }
  },
  computed: {
    persons() {
      //return this.$store.state.person.list;
      return this.$store.getters['person/undeleted']; 
    }
  }
};
