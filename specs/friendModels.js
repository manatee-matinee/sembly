// friendModels.js
var chai = require('chai');
var expect = chai.expect;
var friendModels = require('../server/models/friendModels');
var User = require('../server/schemas/userSchema');
const testUser = require('./testHelpers').generateTestUsers(1)[0];
const testUsers = require('./testHelpers').generateTestUsers(3);

var testId;
var friendId;
var loserId;

describe('Friend Models', function() {
  before(function(done){
    this.timeout(4000);
    User.remove({}).exec()
    .then(function(){
      var users = [new User(testUsers[0]), new User(testUsers[1]), new User(testUsers[2])];
      return User.create(users);
    })
    .then(function(users){
      testId = users[0]._id
      friendId = users[1]._id;
      loserId = users[2]._id;
      done();
    });
  });

  describe('add Friend', function() {
    it('should add a friend request to the potential friend', function(done) {
      friendModels.addFriend(friendId, testId)
      .then(function(){
        return friendModels.addFriend(loserId, testId)
      })
      .then(function() {
        return User.findOne({'email': testUsers[0].email}).exec()
      })
      .then(function(user) {
        expect(user.requests.length).to.equal(2);
        done();
      });
    });
  });

  describe('reject Friend', function() {
    it('should remove the request from the user', function(done) {
      friendModels.rejectFriend(testId, loserId)
      .then(function() {
        return User.findOne({'email': testUsers[0].email}).exec()
      })
      .then(function(user) {
        expect(user.requests.length).to.equal(1);
        done();
      });
    });
  });

  describe('accept Friend', function(){
    before(function(done) {
      friendModels.acceptFriend(testId, friendId)
      .then(function(){
        done();
      })
    })
    it('should add the friend to the user', function(done){
      User.findOne({'email': testUsers[0].email}).exec()
      .then(function(user) {
        expect(user.friends[0]).to.eql(friendId);
        done();
      });
    });
    it('should add the user to the friend\'s friend list' , function(done){
      User.findOne({'email': testUsers[1].email}).exec()
      .then(function(user) {
        expect(user.friends[0]).to.eql(testId);
        done();
      });
    });
    it('should remove the request from the user', function(done){
      User.findOne({'email': testUsers[0].email}).exec()
      .then(function(user) {
        expect(user.requests.length).to.equal(0);
        done();
      });
    });
  });


  describe('get Friends', function() {
    before(function(done){
      User.findOneAndUpdate({'email':testUsers[0].email},{$push:{friends: loserId}}).exec()
      .then(function(){
        done();
      })
    })
    after(function(done){
      User.findOneAndUpdate({'email':testUsers[0].email},{$pull:{friends: loserId}}).exec()
      .then(function(){
        done();
      })
    })
    it('should get all friends with no params', function(done) {
      friendModels.getFriends(testId, '')
      .then(function(user) {
        expect(user.friends.length).to.equal(2);
        done();
      });
    });
    it('should grab friends where the search param is included in the user\'s email', function(done) {
      friendModels.getFriends(testId, 'lose')
      .then(function(user) {
        console.log(user);
        expect(user.friends[0].email).to.equal('loser@test.com');
        done();
      });
    });
    it('should grab friends where the search param is included in the user\'s name', function(done) {
      friendModels.getFriends(testId, 'squa')
      .then(function(user) {
        expect(user.friends[0].email).to.equal(testUsers[1].email);
        done();
      });
    });
  });

  describe('remove Friend', function(){
    before(function(done) {
      friendModels.removeFriend(testId, friendId)
      .then(function(){
        done();
      })
    })
    it('should remove the friend to the user', function(done){
      User.findOne({'email': testUsers[0].email}).exec()
      .then(function(user) {
        expect(user.friends.length).to.equal(1);
        done();
      });
    });
    it('should remove the user from the friend\'s friend list' , function(done){
      User.findOne({'email': testUsers[1].email}).exec()
      .then(function(user) {
        expect(user.friends.length).to.equal(0);
        done();
      });
    });
  });

});
