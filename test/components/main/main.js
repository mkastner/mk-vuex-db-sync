import SyncTypeConstants from '../../../src/sync-type-constants';
import ChangeTypeConstants from '../../../src/change-type-constants';

export default {
  data() {
    return {
      SyncTypes: SyncTypeConstants.Labels,
      syncType: SyncTypeConstants.Types.None,
      newName: ''
    };
  },
  mounted() {
    this.$store.dispatch('person/fetch').catch(err => console.error(err));
  },
  methods: {
    select(index) {
      this.$store.dispatch('person/setIndex', index); 
    },
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
      this.newName = ''; 
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
    currentIndex() {
      return this.$store.state.person.index; 
    },
    syncState() {
      return this.$store.state.person.syncState; 
    },
    persons() {
      //return this.$store.state.person.list;
      return this.$store.getters['person/undeleted']; 
    }
  },
  components: {
    comments: () => import('../comments/comments.vue')
  },
  watch: {
    syncType(val) {
      this.$store.dispatch('person/setSyncType', val);
    } 
  }
};
