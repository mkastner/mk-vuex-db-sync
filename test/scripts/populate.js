const PersonModel = require('../db/person-model');
const CommentModel = require('../db/comment-model');

const PersonMax = 10;
const CommentMax = 500;

async function create () {
  for (let pi = 0; pi < PersonMax; pi++) {
    let person = new PersonModel({name: `User ${pi}`});
    let rawCreatedPerson = await person.save();
    let personId = rawCreatedPerson.toJSON().id;
    for (let ci = 0; ci < CommentMax; ci++) {
      let comment = new CommentModel({title: `title ${ci}`, person_id: personId});
      await comment.save();
    } 
  } 
} 

module.exports = {
  create,
  async main() {
    await create();
    process.exit(0);
  } 
};
